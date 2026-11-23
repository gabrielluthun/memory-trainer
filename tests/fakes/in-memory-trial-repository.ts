import type { TrialDetail, TrialRepository, TrialSummary } from '../../src/lib/application/ports';
import type { CompletedTrial, TrialId } from '../../src/lib/domain/trial/trial';
import { TrialMapper } from '../../src/lib/infrastructure/trial-mapper';

/**
 * Test double for the TrialRepository: keeps closed trials in memory, in order. Reading goes
 * through the real mapper, as on the device.
 */
export class InMemoryTrialRepository implements TrialRepository {
	readonly closed: CompletedTrial[] = [];
	readonly #mapper = new TrialMapper();

	close(trial: CompletedTrial): Promise<void> {
		this.closed.push(trial);
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
