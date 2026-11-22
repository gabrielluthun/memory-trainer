import type { Cancel, Scheduler } from '../../application/ports';

/** Timers of the browser. They may fire late, never early by design; the session re-checks the clock. */
export class BrowserScheduler implements Scheduler {
	after(delayMs: number, task: () => void): Cancel {
		const handle = setTimeout(task, Math.max(0, delayMs));
		return () => clearTimeout(handle);
	}
}
