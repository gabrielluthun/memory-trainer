import Dexie from 'dexie';
import { afterEach, describe, expect, it } from 'vitest';
import { FakeMonotonicClock } from '../../../../tests/fakes/fake-monotonic-clock';
import { NumbersDiscipline } from '../../domain/disciplines/numbers';
import { PausedBeforeMemorization, type TrialSnapshot } from '../../domain/trial/trial';
import { TrialMapper } from '../trial-mapper';
import { MemoryTrainerDatabase } from './database';
import { DexieTrialStore } from './dexie-trial-store';

const completedTrial = (id: string, startedAt = '2026-11-22T10:00:00Z') => {
	const clock = new FakeMonotonicClock();
	const recalling = PausedBeforeMemorization.begin(
		{
			id,
			discipline: new NumbersDiscipline(),
			mode: 'standard',
			format: { itemCount: 3, memorizationMs: 60_000, recallMs: 240_000 },
			pauses: { beforeMemorizationMs: 0, beforeRecallMs: 0 },
			displayPattern: [2],
			items: [1, 2, 3],
			startedAt: new Date(startedAt)
		},
		clock
	)
		.startMemorization()
		.finishMemorization()
		.startRecall();
	recalling.recall.type(1);
	return recalling.finishRecall();
};

let db: MemoryTrainerDatabase | undefined;

afterEach(async () => {
	await db?.delete();
});

describe('DexieTrialStore', () => {
	it('CU03 — closing a trial stores it on the device', async () => {
		db = new MemoryTrainerDatabase(`test-${crypto.randomUUID()}`);
		const store = new DexieTrialStore(db, new TrialMapper());

		await store.close(completedTrial('trial-a'));

		const stored = await db.trials.get('trial-a');
		expect(stored).toMatchObject({ trial_id: 'trial-a', status: 'completed', score: 1 });
		expect(stored?.items).toHaveLength(3);
	});

	it('CU03, RG22 — closing a trial adds it to the upload queue', async () => {
		db = new MemoryTrainerDatabase(`test-${crypto.randomUUID()}`);
		const store = new DexieTrialStore(db, new TrialMapper());

		await store.close(completedTrial('trial-a'));
		await store.close(completedTrial('trial-b'));

		expect((await db.outbox.toArray()).map((entry) => entry.trial_id).sort()).toEqual([
			'trial-a',
			'trial-b'
		]);
	});

	it('US12 CA1 — lists every stored trial, most recent first', async () => {
		db = new MemoryTrainerDatabase(`test-${crypto.randomUUID()}`);
		const store = new DexieTrialStore(db, new TrialMapper());
		await store.close(completedTrial('monday', '2026-11-16T09:00:00Z'));
		await store.close(completedTrial('friday', '2026-11-20T09:00:00Z'));
		await store.close(completedTrial('wednesday', '2026-11-18T09:00:00Z'));

		const trials = await store.list();

		expect(trials.map((trial) => trial.id)).toEqual(['friday', 'wednesday', 'monday']);
		expect(trials[0]).toMatchObject({ status: 'completed', score: 1, itemCount: 3 });
	});

	it('US12 CA2 — gives one stored trial with its detail', async () => {
		db = new MemoryTrainerDatabase(`test-${crypto.randomUUID()}`);
		const store = new DexieTrialStore(db, new TrialMapper());
		await store.close(completedTrial('trial-a'));

		const detail = await store.get('trial-a');

		expect(detail?.results.map((result) => result.correct)).toEqual([true, false, false]);
	});

	it('US12 CA2 — gives null for a trial the device does not have', async () => {
		db = new MemoryTrainerDatabase(`test-${crypto.randomUUID()}`);
		const store = new DexieTrialStore(db, new TrialMapper());

		expect(await store.get('unknown')).toBeNull();
	});
});

const snapshot = (id: string, overrides: Partial<TrialSnapshot> = {}): TrialSnapshot => ({
	id,
	discipline: 'numbers',
	mode: 'standard',
	format: { itemCount: 3, memorizationMs: 60_000, recallMs: 240_000 },
	displayPattern: [2, 3],
	items: [1, 2, 3],
	startedAt: new Date('2026-11-23T21:14:00Z'),
	phase: 'recalling',
	answers: [1, null, null],
	memorizationMs: 40_000,
	recallMs: 20_000,
	...overrides
});

describe('DexieTrialStore — the ongoing trial (US10, SEQ02)', () => {
	const open = () => {
		db = new MemoryTrainerDatabase(`test-${crypto.randomUUID()}`);
		return new DexieTrialStore(db, new TrialMapper());
	};

	it('RG24 — keeps the ongoing trial on the device, dates included', async () => {
		const store = open();

		await store.saveSnapshot(snapshot('trial-a'));

		expect(await store.loadSnapshot()).toEqual(snapshot('trial-a'));
	});

	it('SEQ01 — gives null when no trial was left ongoing', async () => {
		expect(await open().loadSnapshot()).toBeNull();
	});

	it('SEQ02 — each save replaces the previous one: one ongoing trial at most', async () => {
		const store = open();
		await store.saveSnapshot(snapshot('trial-a', { recallMs: 2_000 }));
		await store.saveSnapshot(snapshot('trial-a', { recallMs: 4_000 }));
		await store.saveSnapshot(snapshot('trial-b'));

		expect(await db?.ongoing.count()).toBe(1);
		expect((await store.loadSnapshot())?.id).toBe('trial-b');
	});

	it('CU06 — the ongoing trial never joins the upload queue', async () => {
		const store = open();

		await store.saveSnapshot(snapshot('trial-a'));

		expect(await db?.outbox.count()).toBe(0);
		expect(await db?.trials.count()).toBe(0);
	});

	it('RG23 — "Ne pas garder" erases the ongoing trial, and only that one', async () => {
		const store = open();
		await store.saveSnapshot(snapshot('trial-b'));

		await store.deleteSnapshot('trial-a');
		expect(await store.loadSnapshot()).not.toBeNull();

		await store.deleteSnapshot('trial-b');
		expect(await store.loadSnapshot()).toBeNull();
	});

	it('ENF07 — closing a trial erases its ongoing save in the same transaction', async () => {
		const store = open();
		await store.saveSnapshot(snapshot('trial-a'));

		await store.close(completedTrial('trial-a'));

		expect(await store.loadSnapshot()).toBeNull();
		expect(await db?.trials.count()).toBe(1);
	});

	it('ENF07 — closing another trial keeps the ongoing save', async () => {
		const store = open();
		await store.saveSnapshot(snapshot('trial-b'));

		await store.close(completedTrial('trial-a'));

		expect((await store.loadSnapshot())?.id).toBe('trial-b');
	});

	it('RG18 — a late save of a trial already closed is ignored', async () => {
		const store = open();
		await store.close(completedTrial('trial-a'));

		await store.saveSnapshot(snapshot('trial-a'));

		expect(await store.loadSnapshot()).toBeNull();
	});
});

describe('MemoryTrainerDatabase — version 2', () => {
	it('keeps the trials, the queue and the settings of a version 1 device', async () => {
		const name = `test-${crypto.randomUUID()}`;
		const v1 = new Dexie(name);
		v1.version(1).stores({ trials: 'trial_id, started_at', outbox: 'trial_id', settings: 'id' });
		await v1.table('outbox').put({ trial_id: 'trial-a' });
		v1.close();

		db = new MemoryTrainerDatabase(name);

		expect(await db.outbox.toArray()).toEqual([{ trial_id: 'trial-a' }]);
		expect(await db.ongoing.count()).toBe(0);
	});
});
