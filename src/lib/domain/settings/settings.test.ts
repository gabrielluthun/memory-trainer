import { describe, expect, it } from 'vitest';
import { Settings } from './settings';

describe('Settings', () => {
	it('RG11 — groups of 2 digits by default for Numbers', () => {
		expect(Settings.defaults().groupSizeFor('numbers')).toBe(2);
	});

	it('EF20 — the interface is in French by default', () => {
		expect(Settings.defaults().interfaceLanguage).toBe('fr');
	});

	it('RG11 — changing the group size gives new settings, dated by the device', () => {
		const before = Settings.defaults();
		const at = new Date('2026-11-22T11:00:00Z');

		const after = before.withGroupSize('numbers', 3, at);

		expect(after.groupSizeFor('numbers')).toBe(3);
		expect(after.modifiedAt).toEqual(at);
		expect(before.groupSizeFor('numbers')).toBe(2);
	});

	it('RG11 — refuses a group size outside 1 to 10', () => {
		const at = new Date('2026-11-22T11:00:00Z');

		expect(() => Settings.defaults().withGroupSize('numbers', 0, at)).toThrow(RangeError);
		expect(() => Settings.defaults().withGroupSize('numbers', 11, at)).toThrow(RangeError);
	});

	it('ADR 0012 — rebuilds settings stored on the device', () => {
		const at = new Date('2026-11-22T11:00:00Z');

		const settings = Settings.restore({
			interfaceLanguage: 'en',
			groupSizes: { numbers: 4 },
			modifiedAt: at
		});

		expect(settings.groupSizeFor('numbers')).toBe(4);
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
			groupSizes: { numbers: 3 },
			modifiedAt: at
		});

		expect(settings.pausesFor('numbers')).toEqual({ beforeMemorizationMs: 0, beforeRecallMs: 0 });
		expect(settings.groupSizeFor('numbers')).toBe(3);
	});
});
