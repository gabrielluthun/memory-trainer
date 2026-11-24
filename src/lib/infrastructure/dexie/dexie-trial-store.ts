import type {
	Outbox,
	QueuedTrial,
	ReceivedTrial,
	TrialDetail,
	TrialRepository,
	TrialSummary
} from '../../application/ports';
import type { ClosedTrial, TrialId, TrialSnapshot } from '../../domain/trial/trial';
import type { TrialMapper, TrialRecord } from '../trial-mapper';
import type { MemoryTrainerDatabase, OngoingRecord } from './database';

/**
 * Trials on the device. Implements the repository and the upload queue in one class, so that
 * closing a trial and queueing it happen in the same transaction (class diagram).
 */
export class DexieTrialStore implements TrialRepository, Outbox {
	constructor(
		private readonly db: MemoryTrainerDatabase,
		private readonly mapper: TrialMapper
	) {}

	/** A save landing after the trial was closed would bring it back as interrupted: ignored. */
	async saveSnapshot(snapshot: TrialSnapshot): Promise<void> {
		await this.db.transaction('rw', this.db.ongoing, this.db.trials, async () => {
			if (await this.db.trials.get(snapshot.id)) return;
			await this.db.ongoing.put({ ...snapshot, slot: 'current' });
		});
	}

	async loadSnapshot(): Promise<TrialSnapshot | null> {
		const record = await this.db.ongoing.get('current');
		if (!record) return null;
		const snapshot: Partial<OngoingRecord> = { ...record };
		delete snapshot.slot;
		return snapshot as TrialSnapshot;
	}

	async deleteSnapshot(id: TrialId): Promise<void> {
		await this.db.transaction('rw', this.db.ongoing, () => this.#deleteSnapshotOf(id));
	}

	/** Stored, queued and no longer ongoing, all at once: never lost, never offered twice (ENF07). */
	async close(trial: ClosedTrial): Promise<void> {
		const record = this.mapper.toRecord(trial);
		await this.db.transaction('rw', this.db.trials, this.db.outbox, this.db.ongoing, async () => {
			await this.db.trials.put(record);
			await this.db.outbox.put({ trial_id: record.trial_id });
			await this.#deleteSnapshotOf(record.trial_id);
		});
	}

	async #deleteSnapshotOf(id: TrialId): Promise<void> {
		const ongoing = await this.db.ongoing.get('current');
		if (ongoing?.id === id) await this.db.ongoing.delete('current');
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

	/**
	 * Received trials are stored as they came (RG19); one already on the device is never
	 * rewritten (RG18). The cursor moves in the same transaction: a cut never skips a trial.
	 */
	async addReceived(trials: ReceivedTrial[], cursor: number): Promise<void> {
		await this.db.transaction('rw', this.db.trials, this.db.meta, async () => {
			const known = await this.db.trials.bulkGet(trials.map((trial) => trial.id));
			const unknown = trials.filter((_, index) => known[index] === undefined);
			await this.db.trials.bulkAdd(unknown.map((trial) => trial.record as TrialRecord));
			await this.db.meta.put({ key: 'reception-cursor', value: cursor });
		});
	}

	async readCursor(): Promise<number> {
		return (await this.db.meta.get('reception-cursor'))?.value ?? 0;
	}

	/** The stored record is what the database receives (ADR 0010), the device-only mark aside. */
	async pending(): Promise<QueuedTrial[]> {
		const ids = (await this.db.outbox.toArray()).map((entry) => entry.trial_id);
		const records = (await this.db.trials.bulkGet(ids)).filter((record) => record !== undefined);
		records.sort((a, b) => a.started_at.localeCompare(b.started_at));
		return records.map((record) => {
			const sent: Partial<typeof record> = { ...record };
			delete sent.rejected;
			return { id: record.trial_id, record: sent };
		});
	}

	async remove(id: TrialId): Promise<void> {
		await this.db.outbox.delete(id);
	}

	async markRejected(id: TrialId): Promise<void> {
		await this.db.transaction('rw', this.db.trials, this.db.outbox, async () => {
			await this.db.trials.update(id, { rejected: true });
			await this.db.outbox.delete(id);
		});
	}
}
