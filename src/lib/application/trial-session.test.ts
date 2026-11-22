import { beforeEach, describe, expect, it } from 'vitest';
import { FakeMonotonicClock } from '../../../tests/fakes/fake-monotonic-clock';
import { FakeScheduler } from '../../../tests/fakes/fake-scheduler';
import { InMemoryTrialRepository } from '../../../tests/fakes/in-memory-trial-repository';
import { SeededRandomSource } from '../../../tests/fakes/seeded-random-source';
import { NumbersDiscipline } from '../domain/disciplines/numbers';
import { Settings } from '../domain/settings/settings';
import { TrialSession } from './trial-session.svelte';

let clock: FakeMonotonicClock;
let scheduler: FakeScheduler;
let repository: InMemoryTrialRepository;
let session: TrialSession;
let settings: { current: Settings };

beforeEach(() => {
	clock = new FakeMonotonicClock();
	scheduler = new FakeScheduler(clock);
	repository = new InMemoryTrialRepository();
	settings = { current: Settings.defaults() };
	let id = 0;
	session = new TrialSession({
		discipline: new NumbersDiscipline(),
		clock,
		wallClock: { now: () => new Date('2026-11-22T10:00:00Z') },
		random: new SeededRandomSource(7),
		ids: { next: () => `trial-${++id}` },
		scheduler,
		repository,
		settings
	});
});

describe('TrialSession — US01, a standard Numbers trial', () => {
	it('RG01, RG02 — starts a standard trial of 80 digits, memorization first', () => {
		session.start();
		scheduler.advance(0);

		expect(session.current?.phase).toBe('memorizing');
		expect(session.current?.items).toHaveLength(80);
		expect(session.current?.mode).toBe('standard');
	});

	it('RG21 — draws a new sequence for each trial', () => {
		session.start();
		const first = session.current?.items;
		session.start();

		expect(session.current?.items).not.toEqual(first);
	});

	it('RG01 — stops the memorization by itself after 1 minute, then starts the recall', () => {
		session.start();

		scheduler.advance(59_999);
		expect(session.current?.phase).toBe('memorizing');

		scheduler.advance(1);
		expect(session.current?.phase).toBe('recalling');
		expect(session.memorizationMs).toBe(60_000);
	});

	it('RG01 — a timer firing early never stops the memorization before 1 minute', () => {
		const early = new FakeScheduler(clock);
		const earlySession = new TrialSession({
			discipline: new NumbersDiscipline(),
			clock,
			wallClock: { now: () => new Date('2026-11-22T10:00:00Z') },
			random: new SeededRandomSource(7),
			ids: { next: () => 'early' },
			// Fires every timer at half its delay, as a sleepy browser tab may do the other way round.
			scheduler: {
				after: (delayMs, task) => early.after(delayMs > 1 ? Math.floor(delayMs / 2) : delayMs, task)
			},
			repository,
			settings
		});
		earlySession.start();

		early.advance(59_999);
		expect(earlySession.current?.phase).toBe('memorizing');

		early.advance(1);
		expect(earlySession.memorizationMs).toBe(60_000);
	});

	it('RG08 — the practitioner can finish the memorization earlier', () => {
		session.start();
		scheduler.advance(21_450);

		session.finishMemorization();
		scheduler.advance(0);

		expect(session.current?.phase).toBe('recalling');
		expect(session.memorizationMs).toBe(21_450);
	});

	it('RG08 — finishing early cancels the automatic stop', () => {
		session.start();
		scheduler.advance(10_000);
		session.finishMemorization();

		scheduler.advance(120_000);

		expect(session.memorizationMs).toBe(10_000);
	});

	it('RG10 — typed digits fill the grid and move the selection', () => {
		session.start();
		scheduler.advance(0);
		session.finishMemorization();
		scheduler.advance(0);

		session.type(4);
		session.type(2);

		expect(session.answers.slice(0, 3)).toEqual([4, 2, null]);
		expect(session.selected).toBe(2);
	});

	it('RG01, RG12 — stops the recall by itself after 4 minutes, scores and stores the trial', async () => {
		session.start();
		scheduler.advance(0);
		session.finishMemorization();
		scheduler.advance(0);
		const items = session.current?.items ?? [];
		session.type(items[0]);
		session.type((items[1] + 1) % 10);

		scheduler.advance(240_000);
		await Promise.resolve();

		expect(session.current?.phase).toBe('completed');
		expect(repository.closed).toHaveLength(1);
		expect(repository.closed[0].score).toBe(1);
		expect(repository.closed[0].recallMs).toBe(240_000);
	});

	it('RG12 — the practitioner can finish the recall earlier; the trial is stored once', async () => {
		session.start();
		scheduler.advance(0);
		session.finishMemorization();
		scheduler.advance(30_000);

		await session.finishRecall();
		scheduler.advance(600_000);

		expect(repository.closed).toHaveLength(1);
		expect(repository.closed[0].recallMs).toBe(30_000);
	});

	it('RG19 — the stored trial is dated by the device clock', async () => {
		session.start();
		scheduler.advance(0);
		session.finishMemorization();
		scheduler.advance(0);

		await session.finishRecall();

		expect(repository.closed[0].startedAt).toEqual(new Date('2026-11-22T10:00:00Z'));
		expect(repository.closed[0].id).toBe('trial-1');
	});
});

describe('TrialSession — US07, navigating and finishing the memorization', () => {
	const at = new Date('2026-11-22T11:00:00Z');
	const memorizing = () => {
		session.start();
		scheduler.advance(0);
	};

	it('US07 CA1bis — uses the group size of the settings at launch', () => {
		settings.current = Settings.defaults().withGroupSize('numbers', 4, at);

		memorizing();

		expect(session.groupCount).toBe(20);
		expect(session.group).toHaveLength(4);
	});

	it('RG09 — → and ← move through the groups, Space or ↑ goes back to the start', () => {
		memorizing();

		session.next();
		session.next();
		expect(session.groupIndex).toBe(2);

		session.previous();
		expect(session.groupIndex).toBe(1);

		session.toStart();
		expect(session.groupIndex).toBe(0);
	});

	it('RG09 — the group in the frame follows the navigation', () => {
		memorizing();
		const items = session.current?.items ?? [];

		session.next();

		expect(session.group).toEqual(items.slice(2, 4));
	});

	it('RG09 — → twice quickly on the last group finishes the memorization', () => {
		settings.current = Settings.defaults().withGroupSize('numbers', 10, at);
		memorizing();
		for (let i = 0; i < 7; i++) session.next();
		scheduler.advance(12_000);

		session.next();
		scheduler.advance(200);
		session.next();
		scheduler.advance(0);

		expect(session.current?.phase).toBe('recalling');
		expect(session.memorizationMs).toBe(12_200);
	});
});

describe('TrialSession — choosing a recall cell', () => {
	const recalling = () => {
		session.start();
		scheduler.advance(0);
		session.finishMemorization();
		scheduler.advance(0);
	};

	it('RG10 — the practitioner selects a cell, and the next digit goes there', () => {
		recalling();

		session.select(5);
		session.type(8);

		expect(session.answers[5]).toBe(8);
		expect(session.selected).toBe(6);
	});

	it('RG10 — arrows move the selection, without leaving the grid', () => {
		recalling();

		session.moveSelection(-1);
		expect(session.selected).toBe(0);

		session.moveSelection(3);
		expect(session.selected).toBe(3);

		session.select(79);
		session.moveSelection(1);
		expect(session.selected).toBe(79);
	});
});

describe('TrialSession — launch screen', () => {
	it('RG01 — gives the standard format of the discipline', () => {
		expect(session.standardFormat).toEqual({
			itemCount: 80,
			memorizationMs: 60_000,
			recallMs: 240_000
		});
	});
});
