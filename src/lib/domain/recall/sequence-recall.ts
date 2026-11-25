import type { Digit } from '../disciplines/numbers';

/**
 * Recall grid of a sequence discipline (RG10): one cell per item, a selected cell,
 * the typed digit goes into it and the selection moves on. Backspace, insert (+) and
 * remove (−) fix an omission without retyping the rest (US08). The grid keeps its size.
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

	/** Erases the selected cell if it is filled, otherwise the cell on its left, which becomes selected. */
	backspace(): void {
		if (this.cells[this.selected] === null && this.selected > 0) this.selected -= 1;
		this.cells[this.selected] = null;
	}

	/** + : a blank cell at the selection; the rest shifts right and the last cell leaves the grid. */
	insert(): void {
		this.cells.splice(this.selected, 0, null);
		this.cells.pop();
	}

	/** − : the selected cell goes; the rest shifts left and a blank cell ends the grid. */
	remove(): void {
		this.cells.splice(this.selected, 1);
		this.cells.push(null);
	}

	answers(): (Digit | null)[] {
		return [...this.cells];
	}
}
