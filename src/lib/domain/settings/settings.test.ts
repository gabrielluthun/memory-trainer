import { describe, expect, it } from 'vitest';
import { Settings } from './settings';

describe('Settings', () => {
	it('RG11 — display pattern "2" by default for Numbers', () => {
		expect(Settings.defaults().groupPatternFor('numbers')).toEqual([2]);
	});

	it('EF20 — the interface is in French by default', () => {
		expect(Settings.defaults().interfaceLanguage).toBe('fr');
	});

	it('RG11 — changing the display pattern gives new settings, dated by the device', () => {
		const before = Settings.defaults();
		const at = new Date('2026-11-22T11:00:00Z');

		const after = before.withGroupPattern('numbers', [2, 3], at);

		expect(after.groupPatternFor('numbers')).toEqual([2, 3]);
		expect(after.modifiedAt).toEqual(at);
		expect(before.groupPatternFor('numbers')).toEqual([2]);
	});

	it('RG11 — refuses an invalid display pattern', () => {
		const at = new Date('2026-11-22T11:00:00Z');

		expect(() => Settings.defaults().withGroupPattern('numbers', [], at)).toThrow(RangeError);
		expect(() => Settings.defaults().withGroupPattern('numbers', [2, 2, 2, 2], at)).toThrow(
			RangeError
		);
		expect(() => Settings.defaults().withGroupPattern('numbers', [6], at)).toThrow(RangeError);
	});

	it('ADR 0027 — an old group size of 1 to 5 becomes the matching pattern, a larger one the default', () => {
		const at = new Date('2026-11-22T11:00:00Z');
		const restore = (size: number) =>
			Settings.restore({ interfaceLanguage: 'fr', groupSizes: { numbers: size }, modifiedAt: at });

		expect(restore(4).groupPatternFor('numbers')).toEqual([4]);
		expect(restore(8).groupPatternFor('numbers')).toEqual([2]);
	});

	it('ADR 0012 — rebuilds settings stored on the device', () => {
		const at = new Date('2026-11-22T11:00:00Z');

		const settings = Settings.restore({
			interfaceLanguage: 'en',
			groupPatterns: { numbers: [3, 3] },
			modifiedAt: at
		});

		expect(settings.groupPatternFor('numbers')).toEqual([3, 3]);
		expect(settings.interfaceLanguage).toBe('en');
		expect(settings.modifiedAt).toEqual(at);
	});
});

describe('Settings — preparation pauses (US23)', () => {
	const at = new Date('2026-11-22T12:00:00Z');

	it('RG25 — no pause by default, before memorization or before recall', () => {
		expect(Settings.defaults().pausesFor('numbers')).toEqual({
			beforeMemorizationMs: 0,
			beforeRecallMs: 0
		});
	});

	it('RG25 — keeps the last pauses chosen for a discipline, dated by the device', () => {
		const settings = Settings.defaults().withPauses(
			'numbers',
			{ beforeMemorizationMs: 10_000, beforeRecallMs: 5_000 },
			at
		);

		expect(settings.pausesFor('numbers')).toEqual({
			beforeMemorizationMs: 10_000,
			beforeRecallMs: 5_000
		});
		expect(settings.modifiedAt).toEqual(at);
	});

	it('RG25 — refuses any pause other than 0, 5, 10 or 20 s', () => {
		expect(() =>
			Settings.defaults().withPauses(
				'numbers',
				{ beforeMemorizationMs: 15_000, beforeRecallMs: 0 },
				at
			)
		).toThrow(RangeError);
		expect(() =>
			Settings.defaults().withPauses(
				'numbers',
				{ beforeMemorizationMs: 0, beforeRecallMs: 30_000 },
				at
			)
		).toThrow(RangeError);
	});

	it('RG25 — settings stored before US23, without pauses, get no pause', () => {
		const settings = Settings.restore({
			interfaceLanguage: 'fr',
			groupPatterns: { numbers: [3] },
			modifiedAt: at
		});

		expect(settings.pausesFor('numbers')).toEqual({ beforeMemorizationMs: 0, beforeRecallMs: 0 });
		expect(settings.groupPatternFor('numbers')).toEqual([3]);
	});
});

describe('Settings — last launch settings (US09, ADR 0028)', () => {
	const standard = { itemCount: 80, memorizationMs: 60_000, recallMs: 240_000 };
	const at = new Date('2026-11-24T10:00:00Z');

	it('RG15 — before any custom trial: standard mode, custom settings at the standard format', () => {
		expect(Settings.defaults().launchFor('numbers', standard)).toEqual({
			mode: 'standard',
			custom: { itemCount: 80, memorizationMs: 60_000 }
		});
	});

	it('US09 CA4 — keeps the last mode and custom settings of a discipline, dated by the device', () => {
		const launch = { mode: 'custom' as const, custom: { itemCount: 10, memorizationMs: 30_000 } };

		const after = Settings.defaults().withLaunch('numbers', launch, at);

		expect(after.launchFor('numbers', standard)).toEqual(launch);
		expect(after.modifiedAt).toEqual(at);
		expect(Settings.defaults().launchFor('numbers', standard).mode).toBe('standard');
	});

	it('US09 CA4 — the custom settings are kept when going back to the standard mode', () => {
		const custom = { itemCount: 10, memorizationMs: 30_000 };
		const after = Settings.defaults()
			.withLaunch('numbers', { mode: 'custom', custom }, at)
			.withLaunch('numbers', { mode: 'standard', custom }, at);

		expect(after.launchFor('numbers', standard)).toEqual({ mode: 'standard', custom });
	});

	it('RG15 — refuses custom settings out of bounds', () => {
		expect(() =>
			Settings.defaults().withLaunch(
				'numbers',
				{ mode: 'custom', custom: { itemCount: 501, memorizationMs: 30_000 } },
				at
			)
		).toThrow(RangeError);
	});

	it('ADR 0028 — survives a save and a restore', () => {
		const launch = { mode: 'custom' as const, custom: { itemCount: 12, memorizationMs: 45_000 } };
		const saved = Settings.defaults().withLaunch('numbers', launch, at).toData();

		expect(Settings.restore(saved).launchFor('numbers', standard)).toEqual(launch);
	});

	it('ADR 0028 — settings stored before US09 get the standard launch', () => {
		const old = Settings.defaults().toData();
		delete old.launches;

		expect(Settings.restore(old).launchFor('numbers', standard).mode).toBe('standard');
	});
});

describe('Settings — interface language (US19)', () => {
	const at = new Date('2026-11-24T09:00:00Z');

	it('EF20 — changing the language gives new settings, dated by the device', () => {
		const before = Settings.defaults();

		const after = before.withLanguage('en', at);

		expect(after.interfaceLanguage).toBe('en');
		expect(after.modifiedAt).toEqual(at);
		expect(before.interfaceLanguage).toBe('fr');
	});

	it('US19 CA1 — changing the language keeps every other setting', () => {
		const before = Settings.defaults()
			.withGroupPattern('numbers', [3, 3], at)
			.withPauses('numbers', { beforeMemorizationMs: 5_000, beforeRecallMs: 10_000 }, at);

		const after = before.withLanguage('en', at);

		expect(after.groupPatternFor('numbers')).toEqual([3, 3]);
		expect(after.pausesFor('numbers')).toEqual(before.pausesFor('numbers'));
	});

	it('EF20 — refuses a language other than French or English', () => {
		expect(() => Settings.defaults().withLanguage('de' as 'fr', at)).toThrow(RangeError);
	});
});
