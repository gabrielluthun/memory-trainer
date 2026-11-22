import type { TrialRepository } from '../../src/lib/application/ports';
import type { CompletedTrial } from '../../src/lib/domain/trial/trial';

/** Test double for the TrialRepository: keeps closed trials in memory, in order. */
export class InMemoryTrialRepository implements TrialRepository {
	readonly closed: CompletedTrial[] = [];

	close(trial: CompletedTrial): Promise<void> {
		this.closed.push(trial);
		return Promise.resolve();
	}
}
