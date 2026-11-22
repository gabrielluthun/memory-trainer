import type { DisciplineName } from '../disciplines/discipline';

export type Language = 'fr' | 'en';

export interface SettingsData {
	interfaceLanguage: Language;
	groupSizes: Record<DisciplineName, number>;
	modifiedAt: Date;
}

/**
 * The practitioner's settings (CU15): interface language and group size per discipline.
 * Every change returns new settings, dated by the device; the most recent wins (ADR 0012).
 * Pauses per discipline come with US23, synchronisation with US21.
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
		return new Settings({ ...data, groupSizes: { ...data.groupSizes } });
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

	toData(): SettingsData {
		return { ...this.data, groupSizes: { ...this.data.groupSizes } };
	}
}
