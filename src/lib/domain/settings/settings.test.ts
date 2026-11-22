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
