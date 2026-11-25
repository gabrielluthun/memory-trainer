import { beforeEach, describe, expect, it } from 'vitest';
import { FakeMonotonicClock } from '../../../tests/fakes/fake-monotonic-clock';
import { InMemoryTrialRepository } from '../../../tests/fakes/in-memory-trial-repository';
import { NumbersDiscipline } from '../domain/disciplines/numbers';
import type { TrialSnapshot } from '../domain/trial/trial';
import { InterruptedTrialRecovery } from './interrupted-trial-recovery';

const interrupted: TrialSnapshot = {
	id: 'trial-1',
	discipline: 'numbers',
	mode: 'standard',
	format: { itemCount: 3, memorizationMs: 60_000, recallMs: 240_000 },
	displayPattern: [2],
	items: [1, 2, 3],
	startedAt: new Date('2026-11-23T21:14:00Z'),
	phase: 'recalling',
	answers: [1, 5, null],
	memorizationMs: 40_000,
	recallMs: 20_000
};

let repository: InMemoryTrialRepository;
let recovery: InterruptedTrialRecovery;

beforeEach(() => {
	repository = new InMemoryTrialRepository();
	recovery = new InterruptedTrialRecovery({
		discipline: new NumbersDiscipline(),
		clock: new FakeMonotonicClock(),
		repository
	});
});

describe('InterruptedTrialRecovery — US10, CU06', () => {
	it('SEQ01 — at opening, without an ongoing trial, there is nothing to decide', async () => {
		expect(await recovery.check()).toBeNull();
	});

	it('US10 CA5, RG24 — an ongoing trial left on the device is an interruption waiting for a choice', async () => {
		repository.snapshot = interrupted;

		const pending = await recovery.check();

		expect(pending).toMatchObject({
			phase: 'pending-decision',
			reason: 'interrupted',
			stoppedIn: 'recalling',
			answers: [1, 5, null]
		});
	});

	it('CU06 — never sent before the choice: nothing is closed at opening', async () => {
		repository.snapshot = interrupted;

		await recovery.check();

		expect(repository.closed).toHaveLength(0);
	});

	it('US10 CA6, RG24 — "Garder hors statistiques" stores it as "Erreur externe à l\'application"', async () => {
		repository.snapshot = interrupted;
		await recovery.check();

		const completed = await recovery.decide('keep-out-of-stats');

		expect(completed).toBeNull();
		expect(repository.closed[0]).toMatchObject({ status: 'external_error', recallMs: 20_000 });
		expect(repository.snapshot).toBeNull();
	});

	it('US10 CA6, RG23 — "Compter tel quel" scores the answers saved before the interruption', async () => {
		repository.snapshot = interrupted;
		await recovery.check();

		const completed = await recovery.decide('count-as-is');

		expect(completed).toMatchObject({ id: 'trial-1', status: 'completed', score: 1 });
		expect(repository.closed).toHaveLength(1);
		expect(repository.snapshot).toBeNull();
	});

	it('US10 CA6, RG23 — "Ne pas garder" erases it from the device and stores nothing', async () => {
		repository.snapshot = interrupted;
		await recovery.check();

		await recovery.decide('discard');

		expect(repository.closed).toHaveLength(0);
		expect(repository.snapshot).toBeNull();
	});

	it('CU06 — a choice is made once: a second one does nothing', async () => {
		repository.snapshot = interrupted;
		await recovery.check();
		await recovery.decide('keep-out-of-stats');

		await recovery.decide('count-as-is');

		expect(repository.closed).toHaveLength(1);
	});

	it('CU06 — without an interrupted trial, a choice does nothing', async () => {
		expect(await recovery.decide('count-as-is')).toBeNull();
		expect(repository.closed).toHaveLength(0);
	});
});

describe('InterruptedTrialRecovery — a write that fails', () => {
	it('ENF07 — the choice stays to be made', async () => {
		repository.snapshot = interrupted;
		await recovery.check();
		const close = repository.close.bind(repository);
		repository.close = () => Promise.reject(new Error('Storage full'));

		await expect(recovery.decide('keep-out-of-stats')).rejects.toThrow('Storage full');
		repository.close = close;
		await recovery.decide('keep-out-of-stats');

		expect(repository.closed).toHaveLength(1);
	});
});
