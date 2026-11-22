import { describe, expect, it } from 'vitest';
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
