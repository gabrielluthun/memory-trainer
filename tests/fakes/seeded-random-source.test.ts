import { describe, expect, it } from 'vitest';
import { SeededRandomSource } from './seeded-random-source';

const draw = (source: SeededRandomSource, count: number, max: number) =>
	Array.from({ length: count }, () => source.nextInt(max));

describe('SeededRandomSource', () => {
	it('gives the same sequence for the same seed', () => {
		expect(draw(new SeededRandomSource(42), 80, 10)).toEqual(
			draw(new SeededRandomSource(42), 80, 10)
		);
	});

	it('gives another sequence for another seed', () => {
		expect(draw(new SeededRandomSource(1), 80, 10)).not.toEqual(
			draw(new SeededRandomSource(2), 80, 10)
		);
	});

	it('stays within [0, max)', () => {
		const values = draw(new SeededRandomSource(7), 10_000, 10);

		expect(Math.min(...values)).toBe(0);
		expect(Math.max(...values)).toBe(9);
	});

	it('refuses an empty range', () => {
		expect(() => new SeededRandomSource(1).nextInt(0)).toThrow(RangeError);
	});
});
