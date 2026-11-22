import { Settings } from '../domain/settings/settings';
import type { DisciplineName } from '../domain/disciplines/discipline';
import type { DisplayPattern } from '../domain/navigation/display-pattern';
import type { PreparationPauses } from '../domain/trial/trial';
import type { SettingsRepository, WallClock } from './ports';

/**
 * Reads and changes the settings of the device (CU15). The current settings are exposed as a
 * rune, so the screens and the trial session always see the latest ones (ADR 0025).
 * Synchronisation between devices comes with US21.
 */
export class SettingsService {
	current = $state(Settings.defaults());

	constructor(
		private readonly repository: SettingsRepository,
		private readonly wallClock: WallClock
	) {}

	async load(): Promise<void> {
		this.current = (await this.repository.load()) ?? Settings.defaults();
	}

	/** The pauses of a discipline: its setting, and the last ones used (RG25). */
	async setPauses(discipline: DisciplineName, pauses: PreparationPauses): Promise<void> {
		const updated = this.current.withPauses(discipline, pauses, this.wallClock.now());
		await this.repository.save(updated);
		this.current = updated;
	}

	/** The display pattern of a discipline (RG11, ADR 0027). */
	async setGroupPattern(discipline: DisciplineName, pattern: DisplayPattern): Promise<void> {
		const updated = this.current.withGroupPattern(discipline, pattern, this.wallClock.now());
		await this.repository.save(updated);
		this.current = updated;
	}
}
