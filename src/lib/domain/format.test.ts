import { describe, expect, it } from 'vitest';
import { Format } from './format';

describe('Format.custom — custom mode (US09, RG15)', () => {
	it('RG15 — the practitioner sets the number of items and the memorization time', () => {
		expect(Format.custom(10, 30_000)).toEqual({
			itemCount: 10,
			memorizationMs: 30_000,
			recallMs: 240_000
		});
	});

	it('CU01 — the recall always lasts 4 minutes', () => {
		expect(Format.custom(500, 3_600_000).recallMs).toBe(240_000);
	});

	it.each([1, 80, 500])('accepts %i items', (count) => {
		expect(Format.custom(count, 60_000).itemCount).toBe(count);
	});

	it.each([0, 501, 2.5, Number.NaN])('refuses %d items: 1 to 500', (count) => {
		expect(() => Format.custom(count, 60_000)).toThrow(RangeError);
	});

	it.each([1_000, 60_000, 3_600_000])('accepts %i ms of memorization', (ms) => {
		expect(Format.custom(10, ms).memorizationMs).toBe(ms);
	});

	it.each([0, 999, 3_601_000, 1_500])(
		'refuses %i ms of memorization: whole seconds, from 1 s to 1 h',
		(ms) => {
			expect(() => Format.custom(10, ms)).toThrow(RangeError);
		}
	);
});
