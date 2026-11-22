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
