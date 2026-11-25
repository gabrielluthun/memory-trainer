import type { SettingsRepository } from '../../application/ports';
import { Settings } from '../../domain/settings/settings';
import type { MemoryTrainerDatabase } from './database';

/**
 * Settings of the device in Dexie.js: one record, replaced at each save (CU15), with its mark
 * "to send" (SEQ05).
 */
export class DexieSettingsStore implements SettingsRepository {
	constructor(private readonly db: MemoryTrainerDatabase) {}

	async load(): Promise<Settings | null> {
		const record = await this.db.settings.get('device');
		if (!record) return null;
		// The record may predate the display pattern: restore() converts it (ADR 0027).
		return Settings.restore(record);
	}

	async save(settings: Settings): Promise<void> {
		await this.db.settings.put({ id: 'device', ...settings.toData(), dirty: true });
	}

	async saveReceived(settings: Settings): Promise<void> {
		await this.db.settings.put({ id: 'device', ...settings.toData(), dirty: false });
	}

	async isDirty(): Promise<boolean> {
		const record = await this.db.settings.get('device');
		return record !== undefined && record.dirty !== false;
	}

	/** Only the version that was sent: a change made meanwhile stays to send. */
	async markSynced(modifiedAt: Date): Promise<void> {
		await this.db.transaction('rw', this.db.settings, async () => {
			const record = await this.db.settings.get('device');
			if (record?.modifiedAt.getTime() === modifiedAt.getTime()) {
				await this.db.settings.update('device', { dirty: false });
			}
		});
	}
}
