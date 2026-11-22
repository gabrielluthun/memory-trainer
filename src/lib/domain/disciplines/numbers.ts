import type { RandomSource } from '../random';
import type { Format } from '../format';
import type { Discipline, ItemResult } from './discipline';

/** A digit from 0 to 9 (RG02). */
export type Digit = number;

/** Numbers: random digits, one point per digit at the right position (RG02, RG12). */
export class NumbersDiscipline implements Discipline<Digit, Digit> {
	readonly name = 'numbers';

	standardFormat(): Format {
		return { itemCount: 80, memorizationMs: 60_000, recallMs: 240_000 };
	}

	draw(count: number, random: RandomSource): Digit[] {
		return Array.from({ length: count }, () => random.nextInt(10));
	}

	score(items: Digit[], answers: (Digit | null)[]): ItemResult<Digit, Digit>[] {
		return items.map((expected, index) => {
			const answer = answers[index] ?? null;
			return { position: index + 1, expected, answer, correct: answer === expected };
		});
	}
}
