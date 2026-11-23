import type { TrialDetail, TrialRepository, TrialSummary } from '../../application/ports';
import type { ClosedTrial, TrialId } from '../../domain/trial/trial';
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

	async close(trial: ClosedTrial): Promise<void> {
		const record = this.mapper.toRecord(trial);
		await this.db.transaction('rw', this.db.trials, this.db.outbox, async () => {
			await this.db.trials.put(record);
			await this.db.outbox.put({ trial_id: record.trial_id });
		});
	}
	/** Start dates are ISO strings in universal time, so their index sorts them in time order. */
	async list(): Promise<TrialSummary[]> {
		const records = await this.db.trials.orderBy('started_at').reverse().toArray();
		return records.map((record) => this.mapper.toSummary(record));
	}

	async get(id: TrialId): Promise<TrialDetail | null> {
		const record = await this.db.trials.get(id);
		return record ? this.mapper.toDetail(record) : null;
	}
}
