import type { Discipline } from '../../domain/disciplines/discipline';
import type { Settings } from '../../domain/settings/settings';

/** What the settings need to know of a discipline: its name and its standard format (RG15). */
export type DisciplineDefaults = Pick<Discipline<unknown, unknown>, 'name' | 'standardFormat'>;

/** What save_settings receives (MPD, ADR 0012): the database stores pauses in seconds. */
export interface SettingsPayload {
	interface_language: string;
	settings_modified_at: string;
	disciplines: {
		discipline: string;
		group_pattern: number[];
		pause_before_memorization_s: number;
		pause_before_recall_s: number;
		launch_mode: string;
		custom_item_count: number;
		custom_memorization_s: number;
	}[];
}

/** Every discipline is sent, with its defaults when never changed (RG15, RG25, ADR 0028). */
export function settingsPayload(
	settings: Settings,
	disciplines: DisciplineDefaults[]
): SettingsPayload {
	return {
		interface_language: settings.interfaceLanguage,
		settings_modified_at: settings.modifiedAt.toISOString(),
		disciplines: disciplines.map((discipline) => {
			const pauses = settings.pausesFor(discipline.name);
			const launch = settings.launchFor(discipline.name, discipline.standardFormat());
			return {
				discipline: discipline.name,
				group_pattern: [...settings.groupPatternFor(discipline.name)],
				pause_before_memorization_s: pauses.beforeMemorizationMs / 1_000,
				pause_before_recall_s: pauses.beforeRecallMs / 1_000,
				launch_mode: launch.mode,
				custom_item_count: launch.custom.itemCount,
				custom_memorization_s: launch.custom.memorizationMs / 1_000
			};
		})
	};
}
