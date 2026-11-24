import Dexie, { type EntityTable } from 'dexie';
import type { SettingsData } from '../../domain/settings/settings';
import type { TrialSnapshot } from '../../domain/trial/trial';
import type { TrialRecord } from '../trial-mapper';

/** A trial waiting to be sent to the database (SEQ05). */
export interface OutboxEntry {
	trial_id: string;
}

/**
 * The ongoing trial, saved every 2 s (SEQ02): one record at most, under a fixed key. It only
 * lives on the device and is never sent (CU06).
 */
export interface OngoingRecord extends TrialSnapshot {
	slot: 'current';
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
	ongoing!: EntityTable<OngoingRecord, 'slot'>;

	constructor(name = 'memory-trainer') {
		super(name);
		this.version(1).stores({
			trials: 'trial_id, started_at',
			outbox: 'trial_id',
			settings: 'id'
		});
		// US10: the ongoing trial, to offer the three choices after an interruption (RG24).
		this.version(2).stores({ ongoing: 'slot' });
	}
}
