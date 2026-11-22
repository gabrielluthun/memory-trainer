import { describe, expect, it } from 'vitest';
import { SeededRandomSource } from '../../../../tests/fakes/seeded-random-source';
import { NumbersDiscipline } from './numbers';
import type { RandomSource } from '../random';

/** Returns the given values in order: draws become hand-checkable. */
const scripted = (...values: number[]): RandomSource => {
	let index = 0;
	return { nextInt: () => values[index++ % values.length] };
};

describe('NumbersDiscipline', () => {
	const numbers = new NumbersDiscipline();

	it('RG01, RG02 — the standard format is 80 digits, 1 minute to memorize, 4 minutes to recall', () => {
		expect(numbers.standardFormat()).toMatchObject({
			itemCount: 80,
			memorizationMs: 60_000,
			recallMs: 240_000
		});
	});

	it('RG02 — draws one digit per item from the random source', () => {
		expect(numbers.draw(5, scripted(3, 1, 4, 1, 5))).toEqual([3, 1, 4, 1, 5]);
	});

	it('RG02 — asks the random source for digits from 0 to 9', () => {
		const asked: number[] = [];
		const spy: RandomSource = {
			nextInt: (max) => {
				asked.push(max);
				return 0;
			}
		};

		numbers.draw(3, spy);

		expect(asked).toEqual([10, 10, 10]);
	});

	it('RG21 — draws a new sequence for each trial', () => {
		const random = new SeededRandomSource(42);

		expect(numbers.draw(80, random)).not.toEqual(numbers.draw(80, random));
	});

	it('RG12 — one point per digit at the right position, no penalty for errors or blanks', () => {
		const results = numbers.score([1, 2, 3, 4, 5], [1, 9, null, 4, 6]);

		expect(results.map((result) => result.correct)).toEqual([true, false, false, true, false]);
		expect(results.filter((result) => result.correct)).toHaveLength(2);
	});

	it('RG12, RG19 — keeps each expected digit next to the given answer', () => {
		expect(numbers.score([7, 0], [7, null])).toEqual([
			{ position: 1, expected: 7, answer: 7, correct: true },
			{ position: 2, expected: 0, answer: null, correct: false }
		]);
	});

	it('RG12 — a missing answer at the end counts as a blank', () => {
		expect(numbers.score([1, 2, 3], [1]).map((result) => result.correct)).toEqual([
			true,
			false,
			false
		]);
	});
});
