import { describe, expect, it } from 'vitest';
import { rowMark, rowSizeFor, rowsOf } from './grid-rows';

describe('rowSizeFor — rows of the recall grid and of the corrected copy', () => {
	it('mock-ups 05 and 07 — 20 cells per row on a computer, 10 on a phone', () => {
		expect(rowSizeFor(1200, [2])).toBe(20);
		expect(rowSizeFor(400, [2])).toBe(10);
	});

	it('RG11 — rows are cut on whole groups', () => {
		expect(rowSizeFor(1200, [3])).toBe(18);
		expect(rowSizeFor(400, [2, 3])).toBe(10);
		expect(rowSizeFor(400, [4])).toBe(8);
	});

	it('RG11 — a group wider than a row makes a row on its own', () => {
		expect(rowSizeFor(400, [5, 5, 5])).toBe(15);
	});
});

describe('rowsOf', () => {
	it('splits the cell indexes into rows, the last one shorter', () => {
		expect(rowsOf(5, 2)).toEqual([[0, 1], [2, 3], [4]]);
	});
});

describe('rowMark — the mark in the margin of each row (mock-up 07)', () => {
	it('RG12 — counts the right answers of the row, out of its number of cells', () => {
		const results = [true, false, true, true, false].map((correct) => ({ correct }));

		expect(rowMark(results, [0, 1, 2, 3])).toEqual({ right: 3, total: 4 });
		expect(rowMark(results, [4])).toEqual({ right: 0, total: 1 });
	});
});
