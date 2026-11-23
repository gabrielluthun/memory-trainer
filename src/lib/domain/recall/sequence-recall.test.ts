import { describe, expect, it } from 'vitest';
import type { Digit } from '../disciplines/numbers';
import { SequenceRecall } from './sequence-recall';

describe('SequenceRecall', () => {
	it('RG10 — starts with one blank cell per item and the first cell selected', () => {
		const recall = new SequenceRecall(4);

		expect(recall.answers()).toEqual([null, null, null, null]);
		expect(recall.selected).toBe(0);
	});

	it('RG10 — writes the typed digit in the selected cell, then selects the next one', () => {
		const recall = new SequenceRecall(4);

		recall.type(3);
		recall.type(1);

		expect(recall.answers()).toEqual([3, 1, null, null]);
		expect(recall.selected).toBe(2);
	});

	it('RG10 — stays on the last cell after typing in it', () => {
		const recall = new SequenceRecall(2);

		recall.type(1);
		recall.type(2);
		recall.type(5);

		expect(recall.answers()).toEqual([1, 5]);
		expect(recall.selected).toBe(1);
	});

	it('RG10 — overwrites a cell selected by the practitioner', () => {
		const recall = new SequenceRecall(3);
		recall.type(1);
		recall.type(2);
		recall.type(3);

		recall.select(1);
		recall.type(9);

		expect(recall.answers()).toEqual([1, 9, 3]);
	});

	describe('backspace', () => {
		it('RG10 — erases the selected cell when it is filled, and keeps it selected', () => {
			const recall = filled([1, 2, 3]);
			recall.select(1);

			recall.backspace();

			expect(recall.answers()).toEqual([1, null, 3]);
			expect(recall.selected).toBe(1);
		});

		it('RG10 — erases the cell on the left of an empty selected cell, and selects it', () => {
			const recall = new SequenceRecall(4);
			recall.type(1);
			recall.type(2);

			recall.backspace();

			expect(recall.answers()).toEqual([1, null, null, null]);
			expect(recall.selected).toBe(1);
		});

		it('RG10 — erases the digit just typed in the last cell', () => {
			const recall = new SequenceRecall(2);
			recall.type(1);
			recall.type(2);

			recall.backspace();

			expect(recall.answers()).toEqual([1, null]);
			expect(recall.selected).toBe(1);
		});

		it('RG10 — does nothing on an empty first cell', () => {
			const recall = new SequenceRecall(3);

			recall.backspace();

			expect(recall.answers()).toEqual([null, null, null]);
			expect(recall.selected).toBe(0);
		});
	});

	describe('insert (+)', () => {
		it('RG10 — inserts a blank cell at the selection and shifts the rest; the last digit leaves the grid', () => {
			const recall = filled([4, 1, 5, 9, 2, 6]);
			recall.select(2);

			recall.insert();

			expect(recall.answers()).toEqual([4, 1, null, 5, 9, 2]);
			expect(recall.selected).toBe(2);
		});

		it('RG10 — on the last cell, only blanks it', () => {
			const recall = filled([1, 2, 3]);
			recall.select(2);

			recall.insert();

			expect(recall.answers()).toEqual([1, 2, null]);
		});
	});

	describe('remove (−)', () => {
		it('RG10 — removes the selected cell and brings the rest back, with a blank at the end', () => {
			const recall = filled([4, 1, 5, 9]);
			recall.select(1);

			recall.remove();

			expect(recall.answers()).toEqual([4, 5, 9, null]);
			expect(recall.selected).toBe(1);
		});
	});

	it('refuses a cell outside the grid', () => {
		const recall = new SequenceRecall(3);

		expect(() => recall.select(3)).toThrow(RangeError);
		expect(() => recall.select(-1)).toThrow(RangeError);
	});

	it('RG02 — refuses anything but a digit from 0 to 9', () => {
		const recall = new SequenceRecall(3);

		expect(() => recall.type(10)).toThrow(RangeError);
		expect(() => recall.type(1.5)).toThrow(RangeError);
		expect(recall.answers()).toEqual([null, null, null]);
	});

	it('gives a copy of the answers, which cannot change the grid', () => {
		const recall = new SequenceRecall(2);

		recall.answers()[0] = 7;

		expect(recall.answers()).toEqual([null, null]);
	});
});

/** A grid whose cells are all filled with these digits. */
function filled(digits: Digit[]): SequenceRecall {
	const recall = new SequenceRecall(digits.length);
	for (const digit of digits) recall.type(digit);
	return recall;
}
