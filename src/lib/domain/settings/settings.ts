import type { DisciplineName } from '../disciplines/discipline';
import { Format } from '../format';
import { assertDisplayPattern, type DisplayPattern } from '../navigation/display-pattern';
import type { Mode, PreparationPauses } from '../trial/trial';

export type Language = 'fr' | 'en';

/** The only pause durations allowed: 0, 5, 10 or 20 s (RG25). */
export const PAUSE_DURATIONS_MS = [0, 5_000, 10_000, 20_000] as const;

/** Settings stored before the display pattern (ADR 0027): one group size per discipline. */
export interface LegacySettingsData {
	interfaceLanguage: Language;
	groupSizes: Record<DisciplineName, number>;
	pauses?: Partial<Record<DisciplineName, PreparationPauses>>;
	modifiedAt: Date;
}

const NO_PAUSE: PreparationPauses = { beforeMemorizationMs: 0, beforeRecallMs: 0 };

/**
 * What the launch screen proposes for a discipline (US09 CA4, ADR 0028): the last mode chosen
 * and the custom settings, kept even when going back to the standard mode.
 */
export interface LaunchSettings {
	mode: Mode;
	custom: { itemCount: number; memorizationMs: number };
}

export interface SettingsData {
	interfaceLanguage: Language;
	/** Display pattern per discipline (RG11, ADR 0027). */
	groupPatterns: Record<DisciplineName, DisplayPattern>;
	/** Last pauses chosen per discipline (RG25). Missing in settings stored before US23. */
	pauses?: Partial<Record<DisciplineName, PreparationPauses>>;
	/** Last launch settings per discipline (ADR 0028). Missing in settings stored before US09. */
	launches?: Partial<Record<DisciplineName, LaunchSettings>>;
	modifiedAt: Date;
}

/**
 * The practitioner's settings (CU15): interface language and group size per discipline.
 * Every change returns new settings, dated by the device; the most recent wins (ADR 0012).
 * The pauses chosen for a discipline are both its setting and the last ones used (RG25).
 * Synchronisation comes with US21.
 */
export class Settings {
	private constructor(private readonly data: SettingsData) {}

	/** French interface, groups of 2 digits (wireframes); dated at the epoch, so any change wins. */
	static defaults(): Settings {
		return new Settings({
			interfaceLanguage: 'fr',
			groupPatterns: { numbers: [2] },
			modifiedAt: new Date(0)
		});
	}

	/**
	 * Rebuilds stored settings. Settings stored before the display pattern only had a group size:
	 * 1 to 5 becomes the matching pattern, a larger one the default "2" (ADR 0027).
	 */
	static restore(data: SettingsData | LegacySettingsData): Settings {
		const groupPatterns =
			'groupPatterns' in data
				? data.groupPatterns
				: { numbers: data.groupSizes.numbers <= 5 ? [data.groupSizes.numbers] : [2] };
		return new Settings({
			interfaceLanguage: data.interfaceLanguage,
			groupPatterns: { ...groupPatterns },
			pauses: { ...data.pauses },
			launches: { ...('launches' in data ? data.launches : {}) },
			modifiedAt: data.modifiedAt
		});
	}

	get interfaceLanguage(): Language {
		return this.data.interfaceLanguage;
	}

	get modifiedAt(): Date {
		return this.data.modifiedAt;
	}

	groupPatternFor(discipline: DisciplineName): DisplayPattern {
		return this.data.groupPatterns[discipline];
	}

	withGroupPattern(discipline: DisciplineName, pattern: DisplayPattern, at: Date): Settings {
		assertDisplayPattern(pattern);
		return new Settings({
			...this.data,
			groupPatterns: { ...this.data.groupPatterns, [discipline]: [...pattern] },
			modifiedAt: at
		});
	}

	/** No pause until the practitioner chooses some (RG25, decided with US23). */
	pausesFor(discipline: DisciplineName): PreparationPauses {
		return this.data.pauses?.[discipline] ?? NO_PAUSE;
	}

	withPauses(discipline: DisciplineName, pauses: PreparationPauses, at: Date): Settings {
		for (const duration of [pauses.beforeMemorizationMs, pauses.beforeRecallMs]) {
			if (!(PAUSE_DURATIONS_MS as readonly number[]).includes(duration)) {
				throw new RangeError(`A pause lasts 0, 5, 10 or 20 s, got ${duration} ms`);
			}
		}
		return new Settings({
			...this.data,
			pauses: { ...this.data.pauses, [discipline]: { ...pauses } },
			modifiedAt: at
		});
	}

	/**
	 * The last launch settings of a discipline. Before any custom trial: standard mode, and custom
	 * settings at the standard format of the discipline (RG15, ADR 0028).
	 */
	launchFor(discipline: DisciplineName, standard: Format): LaunchSettings {
		const launch = this.data.launches?.[discipline];
		if (launch) return { mode: launch.mode, custom: { ...launch.custom } };
		return {
			mode: 'standard',
			custom: { itemCount: standard.itemCount, memorizationMs: standard.memorizationMs }
		};
	}

	withLaunch(discipline: DisciplineName, launch: LaunchSettings, at: Date): Settings {
		Format.custom(launch.custom.itemCount, launch.custom.memorizationMs);
		return new Settings({
			...this.data,
			launches: {
				...this.data.launches,
				[discipline]: { mode: launch.mode, custom: { ...launch.custom } }
			},
			modifiedAt: at
		});
	}

	toData(): SettingsData {
		return {
			...this.data,
			groupPatterns: { ...this.data.groupPatterns },
			pauses: { ...this.data.pauses },
			launches: { ...this.data.launches }
		};
	}
}
