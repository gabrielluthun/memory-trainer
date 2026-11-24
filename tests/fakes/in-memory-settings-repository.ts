import type { SettingsRepository } from '../../src/lib/application/ports';
import type { Settings } from '../../src/lib/domain/settings/settings';

/**
 * Test double for the SettingsRepository: one settings object in memory, a count of saves, and
 * the mark "to send" (SEQ05).
 */
export class InMemorySettingsRepository implements SettingsRepository {
	saves = 0;
	dirty: boolean;

	constructor(public stored: Settings | null = null) {
		this.dirty = stored !== null;
	}

	load(): Promise<Settings | null> {
		return Promise.resolve(this.stored);
	}

	save(settings: Settings): Promise<void> {
		this.stored = settings;
		this.saves++;
		this.dirty = true;
		return Promise.resolve();
	}

	isDirty(): Promise<boolean> {
		return Promise.resolve(this.dirty);
	}

	saveReceived(settings: Settings): Promise<void> {
		this.stored = settings;
		this.dirty = false;
		return Promise.resolve();
	}

	markSynced(modifiedAt: Date): Promise<void> {
		if (this.stored?.modifiedAt.getTime() === modifiedAt.getTime()) this.dirty = false;
		return Promise.resolve();
	}
}
