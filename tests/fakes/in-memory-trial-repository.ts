import type { TrialDetail, TrialRepository, TrialSummary } from '../../src/lib/application/ports';
import type { ClosedTrial, TrialId, TrialSnapshot } from '../../src/lib/domain/trial/trial';
import { TrialMapper } from '../../src/lib/infrastructure/trial-mapper';

/**
 * Test double for the TrialRepository: keeps closed trials in memory, in order, and the ongoing
 * trial in one slot. Reading goes through the real mapper, as on the device.
 */
export class InMemoryTrialRepository implements TrialRepository {
	readonly closed: ClosedTrial[] = [];
	snapshot: TrialSnapshot | null = null;
	/** Makes every save of the ongoing trial fail, as a full device would. */
	failSnapshots = false;
	readonly #mapper = new TrialMapper();

	saveSnapshot(snapshot: TrialSnapshot): Promise<void> {
		if (this.failSnapshots) return Promise.reject(new Error('Storage full'));
		if (!this.closed.some((trial) => trial.id === snapshot.id)) this.snapshot = snapshot;
		return Promise.resolve();
	}

	loadSnapshot(): Promise<TrialSnapshot | null> {
		return Promise.resolve(this.snapshot);
	}

	deleteSnapshot(id: TrialId): Promise<void> {
		if (this.snapshot?.id === id) this.snapshot = null;
		return Promise.resolve();
	}

	close(trial: ClosedTrial): Promise<void> {
		this.closed.push(trial);
		if (this.snapshot?.id === trial.id) this.snapshot = null;
		return Promise.resolve();
	}

	list(): Promise<TrialSummary[]> {
		const records = this.closed.map((trial) => this.#mapper.toRecord(trial));
		records.sort((a, b) => b.started_at.localeCompare(a.started_at));
		return Promise.resolve(records.map((record) => this.#mapper.toSummary(record)));
	}

	get(id: TrialId): Promise<TrialDetail | null> {
		const trial = this.closed.find((closed) => closed.id === id);
		return Promise.resolve(trial ? this.#mapper.toDetail(this.#mapper.toRecord(trial)) : null);
	}
}
