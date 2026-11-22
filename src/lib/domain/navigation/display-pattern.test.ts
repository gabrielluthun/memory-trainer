import { describe, expect, it } from 'vitest';
import { assertDisplayPattern, isSubgroupStart, patternSize, splitGroup } from './display-pattern';

describe('Display pattern', () => {
	it('RG11 — accepts 1 to 3 subgroups of 1 to 5 elements', () => {
		expect(() => assertDisplayPattern([2])).not.toThrow();
		expect(() => assertDisplayPattern([2, 3])).not.toThrow();
		expect(() => assertDisplayPattern([5, 5, 5])).not.toThrow();
	});

	it('RG11 — refuses an empty pattern, more than 3 subgroups, or a subgroup outside 1 to 5', () => {
		expect(() => assertDisplayPattern([])).toThrow(RangeError);
		expect(() => assertDisplayPattern([1, 1, 1, 1])).toThrow(RangeError);
		expect(() => assertDisplayPattern([0])).toThrow(RangeError);
		expect(() => assertDisplayPattern([2, 6])).toThrow(RangeError);
		expect(() => assertDisplayPattern([2.5])).toThrow(RangeError);
	});

	it('RG11 — a group holds the sum of the pattern: "2 3" is 5 elements', () => {
		expect(patternSize([2, 3])).toBe(5);
		expect(patternSize([2])).toBe(2);
	});

	it('RG11 — splits a group as the pattern says: "2 3" shows 42 791', () => {
		expect(splitGroup([4, 2, 7, 9, 1], [2, 3])).toEqual([
			[4, 2],
			[7, 9, 1]
		]);
	});

	it('RG11 — a last, shorter group keeps the pattern as far as it goes', () => {
		expect(splitGroup([4, 2, 7], [2, 3])).toEqual([[4, 2], [7]]);
	});

	it('RG11 — the recall grid starts a subgroup where the pattern does, group after group', () => {
		const starts = Array.from({ length: 12 }, (_, index) => index).filter((index) =>
			isSubgroupStart(index, [2, 3])
		);

		expect(starts).toEqual([0, 2, 5, 7, 10]);
	});
});
