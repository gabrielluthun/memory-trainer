import Dexie, { type EntityTable } from 'dexie';
import type { SettingsData } from '../../domain/settings/settings';
import type { TrialRecord } from '../trial-mapper';

/** A trial waiting to be sent to the database (SEQ05). */
export interface OutboxEntry {
	trial_id: string;
}

/** The settings of the device: one record, under a fixed key. */
export interface SettingsRecord extends SettingsData {
	id: 'device';
}

/** The local database of the device (ADR 0004). Each schema change is a new version. */
export class MemoryTrainerDatabase extends Dexie {
	trials!: EntityTable<TrialRecord, 'trial_id'>;
	outbox!: EntityTable<OutboxEntry, 'trial_id'>;
	settings!: EntityTable<SettingsRecord, 'id'>;

	constructor(name = 'memory-trainer') {
		super(name);
		this.version(1).stores({
			trials: 'trial_id, started_at',
			outbox: 'trial_id',
			settings: 'id'
		});
	}
}
