import { afterEach, describe, expect, it } from 'vitest';
import { FakeMonotonicClock } from '../../../../tests/fakes/fake-monotonic-clock';
import { NumbersDiscipline } from '../../domain/disciplines/numbers';
import { PausedBeforeMemorization } from '../../domain/trial/trial';
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
