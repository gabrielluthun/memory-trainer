import type { SettingsRepository } from '../../application/ports';
import { Settings } from '../../domain/settings/settings';
import type { MemoryTrainerDatabase } from './database';

/** Settings of the device in Dexie.js: one record, replaced at each save (CU15). */
export class DexieSettingsStore implements SettingsRepository {
	constructor(private readonly db: MemoryTrainerDatabase) {}

	async load(): Promise<Settings | null> {
		const record = await this.db.settings.get('device');
		if (!record) return null;
		const { interfaceLanguage, groupSizes, pauses, modifiedAt } = record;
		return Settings.restore({ interfaceLanguage, groupSizes, pauses, modifiedAt });
	}

	async save(settings: Settings): Promise<void> {
		await this.db.settings.put({ id: 'device', ...settings.toData() });
	}
}
