import type { MonotonicClock } from '../timing/timing';
import { assertDisplayPattern, patternSize, type DisplayPattern } from './display-pattern';

/** What a press on → did: moved one group, stayed on the last group, or asked to finish (RG09). */
export type NextResult = 'moved' | 'stay' | 'finish';

/** "→ twice quickly" = two presses less than 400 ms apart (value set in the class diagram). */
export const DOUBLE_PRESS_MS = 400;

/**
 * Position in the groups during memorization (RG09, RG11).
 * Only presses made while already on the last group count towards the double press:
 * the press that reaches the last group never finishes the memorization by accident.
 */
export class GroupNavigation {
	current = 0;
	readonly groupCount: number;
	#lastPressOnLastGroupMs: number | null = null;

	/** Number of items in one group: the sum of the display pattern (RG11). */
	readonly groupSize: number;

	constructor(
		private readonly itemCount: number,
		readonly pattern: DisplayPattern,
		private readonly clock: MonotonicClock
	) {
		assertDisplayPattern(pattern);
		this.groupSize = patternSize(pattern);
		this.groupCount = Math.ceil(itemCount / this.groupSize);
	}

	groupBounds(index: number): { start: number; end: number } {
		const start = index * this.groupSize;
		return { start, end: Math.min(start + this.groupSize, this.itemCount) };
	}

	next(): NextResult {
		if (this.current < this.groupCount - 1) {
			this.current++;
			this.#lastPressOnLastGroupMs = null;
			return 'moved';
		}
		const now = this.clock.nowMs();
		const previous = this.#lastPressOnLastGroupMs;
		this.#lastPressOnLastGroupMs = now;
		return previous !== null && now - previous < DOUBLE_PRESS_MS ? 'finish' : 'stay';
	}

	previous(): void {
		this.current = Math.max(0, this.current - 1);
		this.#lastPressOnLastGroupMs = null;
	}

	toStart(): void {
		this.current = 0;
		this.#lastPressOnLastGroupMs = null;
	}
}
