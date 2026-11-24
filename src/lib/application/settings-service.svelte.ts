import { Settings, type Language, type LaunchSettings } from '../domain/settings/settings';
import type { DisciplineName } from '../domain/disciplines/discipline';
import type { DisplayPattern } from '../domain/navigation/display-pattern';
import type { PreparationPauses } from '../domain/trial/trial';
import type { InterfaceLanguage, SettingsRepository, WallClock } from './ports';

/**
 * Reads and changes the settings of the device (CU15). The current settings are exposed as a
 * rune, so the screens and the trial session always see the latest ones (ADR 0025). The interface
 * follows their language (ADR 0029).
 * Synchronisation between devices comes with US21.
 */
export class SettingsService {
	current = $state(Settings.defaults());

	constructor(
		private readonly repository: SettingsRepository,
		private readonly wallClock: WallClock,
		private readonly language: InterfaceLanguage
	) {}

	async load(): Promise<void> {
		this.current = (await this.repository.load()) ?? Settings.defaults();
		this.language.apply(this.current.interfaceLanguage);
	}

	/** US19: applied to the interface once saved, so the choice is kept. */
	async setLanguage(language: Language): Promise<void> {
		const updated = this.current.withLanguage(language, this.wallClock.now());
		await this.repository.save(updated);
		this.current = updated;
		this.language.apply(language);
	}

	/** The pauses of a discipline: its setting, and the last ones used (RG25). */
	async setPauses(discipline: DisciplineName, pauses: PreparationPauses): Promise<void> {
		const updated = this.current.withPauses(discipline, pauses, this.wallClock.now());
		await this.repository.save(updated);
		this.current = updated;
	}

	/**
	 * What a trial was launched with: its pauses and its launch settings, proposed next time
	 * (RG25, US09 CA4, ADR 0028). One change, one save.
	 */
	async setLaunch(
		discipline: DisciplineName,
		pauses: PreparationPauses,
		launch: LaunchSettings
	): Promise<void> {
		const at = this.wallClock.now();
		const updated = this.current
			.withPauses(discipline, pauses, at)
			.withLaunch(discipline, launch, at);
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
