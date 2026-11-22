import type { DisciplineName } from '../disciplines/discipline';
import type { PreparationPauses } from '../trial/trial';

export type Language = 'fr' | 'en';

/** The only pause durations allowed: 0, 5, 10 or 20 s (RG25). */
export const PAUSE_DURATIONS_MS = [0, 5_000, 10_000, 20_000] as const;

const NO_PAUSE: PreparationPauses = { beforeMemorizationMs: 0, beforeRecallMs: 0 };

export interface SettingsData {
	interfaceLanguage: Language;
	groupSizes: Record<DisciplineName, number>;
	/** Last pauses chosen per discipline (RG25). Missing in settings stored before US23. */
	pauses?: Partial<Record<DisciplineName, PreparationPauses>>;
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
			groupSizes: { numbers: 2 },
			modifiedAt: new Date(0)
		});
	}

	static restore(data: SettingsData): Settings {
		return new Settings({
			...data,
			groupSizes: { ...data.groupSizes },
			pauses: { ...data.pauses }
		});
	}

	get interfaceLanguage(): Language {
		return this.data.interfaceLanguage;
	}

	get modifiedAt(): Date {
		return this.data.modifiedAt;
	}

	groupSizeFor(discipline: DisciplineName): number {
		return this.data.groupSizes[discipline];
	}

	withGroupSize(discipline: DisciplineName, size: number, at: Date): Settings {
		if (!Number.isInteger(size) || size < 1 || size > 10) {
			throw new RangeError(`Group size must be from 1 to 10, got ${size}`);
		}
		return new Settings({
			...this.data,
			groupSizes: { ...this.data.groupSizes, [discipline]: size },
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

	toData(): SettingsData {
		return {
			...this.data,
			groupSizes: { ...this.data.groupSizes },
			pauses: { ...this.data.pauses }
		};
	}
}
