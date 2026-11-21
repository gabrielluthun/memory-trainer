/**
 * Test double for the MonotonicClock interface (class diagram, Infrastructure section).
 * Time only moves when a test calls `advance`, so timings are exact and reproducible (ENF01).
 */
export class FakeMonotonicClock {
	#nowMs: number;

	constructor(startMs = 0) {
		this.#nowMs = startMs;
	}

	nowMs(): number {
		return this.#nowMs;
	}

	advance(ms: number): void {
		if (!Number.isFinite(ms) || ms < 0) {
			throw new RangeError(`A monotonic clock cannot go back or jump by ${ms} ms`);
		}
		this.#nowMs += ms;
	}
}
