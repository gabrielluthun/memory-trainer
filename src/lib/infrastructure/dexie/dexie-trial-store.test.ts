import { afterEach, describe, expect, it } from 'vitest';
import { FakeMonotonicClock } from '../../../../tests/fakes/fake-monotonic-clock';
import { NumbersDiscipline } from '../../domain/disciplines/numbers';
import { PausedBeforeMemorization } from '../../domain/trial/trial';
import { TrialMapper } from '../trial-mapper';
import { MemoryTrainerDatabase } from './database';
import { DexieTrialStore } from './dexie-trial-store';

const completedTrial = (id: string) => {
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
			startedAt: new Date('2026-11-22T10:00:00Z')
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
});
