import { describe, expect, it } from 'vitest';
import { InMemoryTrialRepository } from '../../../tests/fakes/in-memory-trial-repository';
import { notifyOnClose } from './notify-on-close';

describe('notifyOnClose — end of a trial, a trigger of the synchronisation (CU17)', () => {
	it('CU17 — tells once the trial is stored, never before', async () => {
		const repository = new InMemoryTrialRepository();
		const storedWhenTold: number[] = [];
		const notifying = notifyOnClose(repository, () =>
			storedWhenTold.push(repository.closed.length)
		);
		const trial = { id: 'trial-a' } as Parameters<typeof repository.close>[0];

		await notifying.close(trial);

		expect(storedWhenTold).toEqual([1]);
	});

	it('passes everything else through unchanged', async () => {
		const repository = new InMemoryTrialRepository();
		repository.cursor = 4;
		const notifying = notifyOnClose(repository, () => {});

		expect(await notifying.readCursor()).toBe(4);
		expect(await notifying.list()).toEqual([]);
		expect(await notifying.loadSnapshot()).toBeNull();
	});
});
