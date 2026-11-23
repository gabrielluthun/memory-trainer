import { patternSize, type DisplayPattern } from '../domain/navigation/display-pattern';

/** Below this window width, the screens use the phone layout (mock-ups). */
const PHONE_WIDTH = 760;

/**
 * Cells per row of the recall grid and of the corrected copy (mock-ups 05 and 07): about 20 on a
 * computer, 10 on a phone, always cut on whole groups of the display pattern (RG11).
 */
export function rowSizeFor(windowWidth: number, pattern: DisplayPattern): number {
	const groupSize = patternSize(pattern);
	const target = windowWidth < PHONE_WIDTH ? 10 : 20;
	return Math.max(groupSize, Math.floor(target / groupSize) * groupSize);
}

/** Cell indexes split into rows of `rowSize`, the last row possibly shorter. */
export function rowsOf(cellCount: number, rowSize: number): number[][] {
	return Array.from({ length: Math.ceil(cellCount / rowSize) }, (_, row) =>
		Array.from(
			{ length: Math.min(rowSize, cellCount - row * rowSize) },
			(_, column) => row * rowSize + column
		)
	);
}

/** Mark in the margin of a row of the corrected copy: right answers out of the row's cells (RG12). */
export function rowMark(
	results: readonly { correct: boolean }[],
	row: readonly number[]
): { right: number; total: number } {
	return { right: row.filter((index) => results[index].correct).length, total: row.length };
}
