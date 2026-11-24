import { describe, expect, it } from 'vitest';
import { NumbersDiscipline } from '../../domain/disciplines/numbers';
import { Settings } from '../../domain/settings/settings';
import { settingsFromApi, settingsPayload } from './settings-payload';

const at = new Date('2026-11-24T09:00:00Z');

describe('settingsPayload — what save_settings receives (ADR 0012, ADR 0028)', () => {
	it('ADR 0012 — the language and the device time of the change', () => {
		const payload = settingsPayload(Settings.defaults().withLanguage('en', at), [
			new NumbersDiscipline()
		]);

		expect(payload).toMatchObject({
			interface_language: 'en',
			settings_modified_at: '2026-11-24T09:00:00.000Z'
		});
	});

	it('RG11, RG25, ADR 0028 — each discipline: pattern, pauses in seconds, last launch', () => {
		const settings = Settings.defaults()
			.withGroupPattern('numbers', [2, 3], at)
			.withPauses('numbers', { beforeMemorizationMs: 5_000, beforeRecallMs: 20_000 }, at)
			.withLaunch(
				'numbers',
				{ mode: 'custom', custom: { itemCount: 40, memorizationMs: 30_000 } },
				at
			);

		expect(settingsPayload(settings, [new NumbersDiscipline()]).disciplines).toEqual([
			{
				discipline: 'numbers',
				group_pattern: [2, 3],
				pause_before_memorization_s: 5,
				pause_before_recall_s: 20,
				launch_mode: 'custom',
				custom_item_count: 40,
				custom_memorization_s: 30
			}
		]);
	});

	it('RG15 — before any custom trial, the custom settings are the standard format', () => {
		const [numbers] = settingsPayload(Settings.defaults(), [new NumbersDiscipline()]).disciplines;

		expect(numbers).toMatchObject({
			pause_before_memorization_s: 0,
			pause_before_recall_s: 0,
			launch_mode: 'standard',
			custom_item_count: 80,
			custom_memorization_s: 60
		});
	});
});

describe('settingsFromApi — settings read from the Data API (ADR 0012)', () => {
	const row = {
		interface_language: 'en',
		settings_modified_at: '2026-11-24T08:00:00+00:00',
		discipline_settings: [
			{
				discipline: 'numbers',
				group_pattern: [2, 3],
				pause_before_memorization_s: 5,
				pause_before_recall_s: 10,
				launch_mode: 'custom',
				custom_item_count: 40,
				custom_memorization_s: 30
			}
		]
	};

	it('ADR 0012 — every setting, with the time of the change', () => {
		const settings = settingsFromApi(row);

		expect(settings?.interfaceLanguage).toBe('en');
		expect(settings?.modifiedAt).toEqual(new Date('2026-11-24T08:00:00Z'));
		expect(settings?.groupPatternFor('numbers')).toEqual([2, 3]);
		expect(settings?.pausesFor('numbers')).toEqual({
			beforeMemorizationMs: 5_000,
			beforeRecallMs: 10_000
		});
		expect(settings?.launchFor('numbers', new NumbersDiscipline().standardFormat())).toEqual({
			mode: 'custom',
			custom: { itemCount: 40, memorizationMs: 30_000 }
		});
	});

	it('ADR 0012 — round trip: what save_settings receives comes back the same', () => {
		const sent = Settings.defaults()
			.withLanguage('en', at)
			.withGroupPattern('numbers', [4], at)
			.withPauses('numbers', { beforeMemorizationMs: 20_000, beforeRecallMs: 0 }, at);
		const payload = settingsPayload(sent, [new NumbersDiscipline()]);

		const back = settingsFromApi({
			interface_language: payload.interface_language,
			settings_modified_at: payload.settings_modified_at,
			discipline_settings: payload.disciplines
		});

		expect(back?.toData()).toEqual({
			...sent.toData(),
			launches: { numbers: { mode: 'standard', custom: { itemCount: 80, memorizationMs: 60_000 } } }
		});
	});

	it('ADR 0012 — no device ever sent settings: nothing to take', () => {
		expect(
			settingsFromApi({
				interface_language: 'fr',
				settings_modified_at: '-infinity',
				discipline_settings: []
			})
		).toBeNull();
	});

	it('RG11 — a discipline without settings yet keeps its defaults', () => {
		const settings = settingsFromApi({ ...row, discipline_settings: [] });

		expect(settings?.groupPatternFor('numbers')).toEqual([2]);
		expect(settings?.pausesFor('numbers').beforeMemorizationMs).toBe(0);
	});
});
