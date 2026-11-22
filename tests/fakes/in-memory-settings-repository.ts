import type { SettingsRepository } from '../../src/lib/application/ports';
import type { Settings } from '../../src/lib/domain/settings/settings';

/** Test double for the SettingsRepository: one settings object in memory. */
export class InMemorySettingsRepository implements SettingsRepository {
	constructor(public stored: Settings | null = null) {}

	load(): Promise<Settings | null> {
		return Promise.resolve(this.stored);
	}

	save(settings: Settings): Promise<void> {
		this.stored = settings;
		return Promise.resolve();
	}
}
