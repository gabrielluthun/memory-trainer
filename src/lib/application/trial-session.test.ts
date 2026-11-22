import { beforeEach, describe, expect, it } from 'vitest';
import { FakeMonotonicClock } from '../../../tests/fakes/fake-monotonic-clock';
import { FakeScheduler } from '../../../tests/fakes/fake-scheduler';
import { InMemoryTrialRepository } from '../../../tests/fakes/in-memory-trial-repository';
import { SeededRandomSource } from '../../../tests/fakes/seeded-random-source';
import { NumbersDiscipline } from '../domain/disciplines/numbers';
import { Settings } from '../domain/settings/settings';
import type { PreparationPauses } from '../domain/trial/trial';
import { TrialSession } from './trial-session.svelte';

let clock: FakeMonotonicClock;
let scheduler: FakeScheduler;
let repository: InMemoryTrialRepository;
let session: TrialSession;
let settings: {
	current: Settings;
	setPauses: (discipline: 'numbers', pauses: PreparationPauses) => Promise<void>;
};

beforeEach(() => {
	clock = new FakeMonotonicClock();
	scheduler = new FakeScheduler(clock);
	repository = new InMemoryTrialRepository();
	settings = {
		current: Settings.defaults(),
		setPauses(discipline, pauses) {
			this.current = this.current.withPauses(discipline, pauses, new Date('2026-11-22T12:00:00Z'));
			return Promise.resolve();
		}
	};
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

	it('US07 CA1bis — uses the display pattern of the settings at launch', () => {
		settings.current = Settings.defaults().withGroupPattern('numbers', [2, 3], at);

		memorizing();

		expect(session.displayPattern).toEqual([2, 3]);
		expect(session.groupCount).toBe(16);
		expect(session.group).toHaveLength(5);
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
		settings.current = Settings.defaults().withGroupPattern('numbers', [5, 5], at);
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

describe('TrialSession — US23, preparation pauses', () => {
	const pauses = (beforeMemorizationMs: number, beforeRecallMs: number) => ({
		beforeMemorizationMs,
		beforeRecallMs
	});

	it('US23 CA1, CA2 — counts down the chosen pause before showing the digits', () => {
		session.start({ pauses: pauses(10_000, 0) });

		scheduler.advance(9_999);
		expect(session.current?.phase).toBe('paused-before-memorization');

		scheduler.advance(1);
		expect(session.current?.phase).toBe('memorizing');
	});

	it('US23 CA1, RG25 — the pauses chosen are kept for the next launch', () => {
		session.start({ pauses: pauses(5_000, 20_000) });

		expect(settings.current.pausesFor('numbers')).toEqual(pauses(5_000, 20_000));
	});

	it('RG25 — without a choice, uses the pauses of the settings', () => {
		settings.current = Settings.defaults().withPauses('numbers', pauses(20_000, 0), new Date(0));

		session.start();
		scheduler.advance(19_999);

		expect(session.current?.phase).toBe('paused-before-memorization');
	});

	it('US23 CA3 — the practitioner can cut a pause short, before memorization or before recall', () => {
		session.start({ pauses: pauses(20_000, 20_000) });

		session.skipPause();
		expect(session.current?.phase).toBe('memorizing');

		session.finishMemorization();
		expect(session.current?.phase).toBe('paused-before-recall');
		session.skipPause();
		expect(session.current?.phase).toBe('recalling');
	});

	it('US23 CA3 — a pause cut short does not start the next phase a second time', () => {
		session.start({ pauses: pauses(10_000, 0) });
		session.skipPause();
		scheduler.advance(3_000);

		scheduler.advance(10_000);

		expect(session.current?.phase).toBe('memorizing');
		expect(session.memorizationMs).toBeNull();
	});

	it('US23 CA5 — the pauses never count in the memorization and recall times', async () => {
		session.start({ pauses: pauses(5_000, 10_000) });
		scheduler.advance(5_000);
		scheduler.advance(20_000);
		session.finishMemorization();
		scheduler.advance(10_000);
		scheduler.advance(30_000);

		await session.finishRecall();

		expect(repository.closed[0].memorizationMs).toBe(20_000);
		expect(repository.closed[0].recallMs).toBe(30_000);
	});

	it('US23 CA6 — abandoning during the first pause keeps nothing and asks nothing', () => {
		session.start({ pauses: pauses(10_000, 0) });

		session.cancel();
		scheduler.advance(600_000);

		expect(session.current).toBeNull();
		expect(repository.closed).toHaveLength(0);
	});

	it('US23 CA6 — once the digits are shown, cancel does nothing (abandon comes with US10)', () => {
		session.start();
		scheduler.advance(0);

		session.cancel();

		expect(session.current?.phase).toBe('memorizing');
	});
});
