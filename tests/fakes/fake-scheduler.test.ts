import { describe, expect, it } from 'vitest';
import { FakeMonotonicClock } from './fake-monotonic-clock';
import { FakeScheduler } from './fake-scheduler';

describe('FakeScheduler', () => {
	it('runs a task only once its delay has elapsed, with the clock at its due time', () => {
		const clock = new FakeMonotonicClock();
		const scheduler = new FakeScheduler(clock);
		const ranAt: number[] = [];
		scheduler.after(1_000, () => ranAt.push(clock.nowMs()));

		scheduler.advance(999);
		expect(ranAt).toEqual([]);

		scheduler.advance(5_000);
		expect(ranAt).toEqual([1_000]);
		expect(clock.nowMs()).toBe(5_999);
	});

	it('runs due tasks in time order, then in scheduling order', () => {
		const scheduler = new FakeScheduler(new FakeMonotonicClock());
		const ran: string[] = [];
		scheduler.after(200, () => ran.push('b'));
		scheduler.after(100, () => ran.push('a'));
		scheduler.after(200, () => ran.push('c'));

		scheduler.advance(300);

		expect(ran).toEqual(['a', 'b', 'c']);
	});

	it('also runs tasks scheduled by a task, when they fall due', () => {
		const scheduler = new FakeScheduler(new FakeMonotonicClock());
		const ran: string[] = [];
		scheduler.after(0, () => {
			ran.push('first');
			scheduler.after(50, () => ran.push('second'));
		});

		scheduler.advance(100);

		expect(ran).toEqual(['first', 'second']);
	});

	it('never runs a cancelled task', () => {
		const scheduler = new FakeScheduler(new FakeMonotonicClock());
		const ran: string[] = [];
		const cancel = scheduler.after(100, () => ran.push('cancelled'));

		cancel();
		scheduler.advance(1_000);

		expect(ran).toEqual([]);
		expect(scheduler.pendingCount).toBe(0);
	});
});
