import type { TrialRepository } from '../../application/ports';
import type { CompletedTrial } from '../../domain/trial/trial';
import type { TrialMapper } from '../trial-mapper';
import type { MemoryTrainerDatabase } from './database';

/**
 * Trials on the device. Implements the repository and the upload queue in one class, so that
 * closing a trial and queueing it happen in the same transaction (class diagram).
 */
export class DexieTrialStore implements TrialRepository {
	constructor(
		private readonly db: MemoryTrainerDatabase,
		private readonly mapper: TrialMapper
	) {}

	async close(trial: CompletedTrial): Promise<void> {
		const record = this.mapper.toRecord(trial);
		await this.db.transaction('rw', this.db.trials, this.db.outbox, async () => {
			await this.db.trials.put(record);
			await this.db.outbox.put({ trial_id: record.trial_id });
		});
	}
}
