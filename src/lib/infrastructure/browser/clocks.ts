import type { WallClock } from '../../application/ports';
import type { MonotonicClock } from '../../domain/timing/timing';

/** `performance.now()`: never goes back, unaffected by changes of the device time (ENF01). */
export class BrowserMonotonicClock implements MonotonicClock {
	nowMs(): number {
		return performance.now();
	}
}

/** The device date and time, to date trials (RG22). */
export class BrowserWallClock implements WallClock {
	now(): Date {
		return new Date();
	}
}
