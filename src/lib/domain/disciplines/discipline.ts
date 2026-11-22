import type { Format } from '../format';
import type { RandomSource } from '../random';

/** Name of a discipline, as stored in the database (`disciplines.discipline`). */
export type DisciplineName = 'numbers';

/** One expected item next to the answer given for it (RG12, RG19). */
export interface ItemResult<Item, Answer> {
	position: number;
	expected: Item;
	answer: Answer | null;
	correct: boolean;
}

/** What changes from one discipline to another: format, draw, correction (ADR 0013). */
export interface Discipline<Item, Answer> {
	readonly name: DisciplineName;
	standardFormat(): Format;
	draw(count: number, random: RandomSource): Item[];
	score(items: Item[], answers: (Answer | null)[]): ItemResult<Item, Answer>[];
}
