import type { Cancel, Scheduler } from '../../src/lib/application/ports';
import type { FakeMonotonicClock } from './fake-monotonic-clock';

/**
 * Test double for the Scheduler: tasks run only when the test advances time,
 * in due order, with the fake clock moved to each due time.
 */
export class FakeScheduler implements Scheduler {
	#tasks: { dueMs: number; order: number; task: () => void }[] = [];
	#order = 0;

	constructor(private readonly clock: FakeMonotonicClock) {}

	after(delayMs: number, task: () => void): Cancel {
		const entry = { dueMs: this.clock.nowMs() + Math.max(0, delayMs), order: this.#order++, task };
		this.#tasks.push(entry);
		return () => {
			this.#tasks = this.#tasks.filter((other) => other !== entry);
		};
	}

	/** Moves time forward, running every task that falls due, including tasks they schedule. */
	advance(ms: number): void {
		const targetMs = this.clock.nowMs() + ms;
		for (;;) {
			const next = this.#tasks
				.filter((entry) => entry.dueMs <= targetMs)
				.sort((a, b) => a.dueMs - b.dueMs || a.order - b.order)[0];
			if (!next) break;
			this.#tasks = this.#tasks.filter((entry) => entry !== next);
			this.clock.advance(next.dueMs - this.clock.nowMs());
			next.task();
		}
		this.clock.advance(targetMs - this.clock.nowMs());
	}

	get pendingCount(): number {
		return this.#tasks.length;
	}
}
