/**
 * Display pattern of a group (RG11, ADR 0027): 1 to 3 subgroups of 1 to 5 elements.
 * "2 3" shows a group of 5 digits as "42 791"; → moves on by the whole pattern.
 */
export type DisplayPattern = readonly number[];

export function assertDisplayPattern(pattern: DisplayPattern): void {
	const valid =
		pattern.length >= 1 &&
		pattern.length <= 3 &&
		pattern.every((size) => Number.isInteger(size) && size >= 1 && size <= 5);
	if (!valid) {
		throw new RangeError(
			`A display pattern has 1 to 3 subgroups of 1 to 5, got [${pattern.join(', ')}]`
		);
	}
}

/** Number of elements in one group. */
export function patternSize(pattern: DisplayPattern): number {
	return pattern.reduce((total, size) => total + size, 0);
}

/** Cuts one group into its subgroups; a shorter last group keeps the pattern as far as it goes. */
export function splitGroup<T>(group: readonly T[], pattern: DisplayPattern): T[][] {
	const subgroups: T[][] = [];
	let start = 0;
	for (const size of pattern) {
		if (start >= group.length) break;
		subgroups.push(group.slice(start, start + size));
		start += size;
	}
	return subgroups;
}

/** Whether the element at this index (in the whole sequence) starts a subgroup. */
export function isSubgroupStart(index: number, pattern: DisplayPattern): boolean {
	let offset = index % patternSize(pattern);
	for (const size of pattern) {
		if (offset === 0) return true;
		offset -= size;
		if (offset < 0) return false;
	}
	return false;
}
