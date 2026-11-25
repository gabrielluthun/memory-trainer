/** Clock that never goes back, whatever the wall clock does (ENF01). `performance.now()` in the browser. */
export interface MonotonicClock {
	nowMs(): number;
}

/** Measures a phase on the monotonic clock. Stopping returns a new, frozen stopwatch. */
export class Stopwatch {
	private constructor(
		private readonly clock: MonotonicClock,
		private readonly startedAtMs: number,
		private readonly stoppedAtMs: number | null
	) {}

	static start(clock: MonotonicClock): Stopwatch {
		return new Stopwatch(clock, clock.nowMs(), null);
	}

	stop(): Stopwatch {
		return new Stopwatch(this.clock, this.startedAtMs, this.clock.nowMs());
	}

	elapsedMs(): number {
		return (this.stoppedAtMs ?? this.clock.nowMs()) - this.startedAtMs;
	}
}

/** Time left before a preparation pause ends (RG25). */
export class Countdown {
	private constructor(
		private readonly stopwatch: Stopwatch,
		readonly durationMs: number
	) {}

	static start(clock: MonotonicClock, durationMs: number): Countdown {
		return new Countdown(Stopwatch.start(clock), durationMs);
	}

	remainingMs(): number {
		return Math.max(0, this.durationMs - this.stopwatch.elapsedMs());
	}

	isOver(): boolean {
		return this.remainingMs() === 0;
	}
}
