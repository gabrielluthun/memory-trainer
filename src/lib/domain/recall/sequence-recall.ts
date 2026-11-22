import type { Digit } from '../disciplines/numbers';

/**
 * Recall grid of a sequence discipline (RG10): one cell per item, a selected cell,
 * the typed digit goes into it and the selection moves on.
 * Insert, remove and backspace come with US08.
 */
export class SequenceRecall {
	private readonly cells: (Digit | null)[];
	selected = 0;

	constructor(cellCount: number) {
		this.cells = Array.from({ length: cellCount }, () => null);
	}

	select(index: number): void {
		if (!Number.isInteger(index) || index < 0 || index >= this.cells.length) {
			throw new RangeError(`No cell at index ${index}`);
		}
		this.selected = index;
	}

	type(digit: Digit): void {
		if (!Number.isInteger(digit) || digit < 0 || digit > 9) {
			throw new RangeError(`Not a digit: ${digit}`);
		}
		this.cells[this.selected] = digit;
		this.selected = Math.min(this.selected + 1, this.cells.length - 1);
	}

	answers(): (Digit | null)[] {
		return [...this.cells];
	}
}
