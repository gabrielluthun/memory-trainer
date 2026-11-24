/** Number of items and durations of a trial (RG01, RG15). */
export interface Format {
	readonly itemCount: number;
	readonly memorizationMs: number;
	readonly recallMs: number;
}

/** Bounds of the custom mode (data dictionary): 1 to 500 items, 1 s to 1 h, whole seconds. */
export const CUSTOM_LIMITS = {
	minItems: 1,
	maxItems: 500,
	minMemorizationMs: 1_000,
	maxMemorizationMs: 3_600_000
} as const;

/** The recall always lasts 4 minutes, in custom mode too (RG01, decision CU01). */
const RECALL_MS = 240_000;

export const Format = {
	/** A custom format (RG15): items and memorization time chosen, 4 minutes of recall. */
	custom(itemCount: number, memorizationMs: number): Format {
		const { minItems, maxItems, minMemorizationMs, maxMemorizationMs } = CUSTOM_LIMITS;
		if (!Number.isInteger(itemCount) || itemCount < minItems || itemCount > maxItems) {
			throw new RangeError(`A custom trial has 1 to 500 items, got ${itemCount}`);
		}
		if (
			!Number.isInteger(memorizationMs / 1_000) ||
			memorizationMs < minMemorizationMs ||
			memorizationMs > maxMemorizationMs
		) {
			throw new RangeError(
				`A custom memorization lasts whole seconds, from 1 s to 1 h, got ${memorizationMs} ms`
			);
		}
		return { itemCount, memorizationMs, recallMs: RECALL_MS };
	}
};
