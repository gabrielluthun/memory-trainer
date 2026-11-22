import { describe, expect, it } from 'vitest';
import { FakeMonotonicClock } from '../../../../tests/fakes/fake-monotonic-clock';
import { Countdown, Stopwatch } from './timing';

describe('Stopwatch', () => {
	it('ENF01 — measures the time elapsed since it started, to the millisecond', () => {
		const clock = new FakeMonotonicClock(5_000);
		const stopwatch = Stopwatch.start(clock);

		clock.advance(58_123);

		expect(stopwatch.elapsedMs()).toBe(58_123);
	});

	it('stops counting once stopped', () => {
		const clock = new FakeMonotonicClock();
		const running = Stopwatch.start(clock);
		clock.advance(1_500);

		const stopped = running.stop();
		clock.advance(10_000);

		expect(stopped.elapsedMs()).toBe(1_500);
	});

	it('keeps the running stopwatch untouched when stopping it', () => {
		const clock = new FakeMonotonicClock();
		const running = Stopwatch.start(clock);
		clock.advance(1_000);

		running.stop();
		clock.advance(1_000);

		expect(running.elapsedMs()).toBe(2_000);
	});
});

describe('Countdown', () => {
	it('RG25 — gives the time left, never below zero', () => {
		const clock = new FakeMonotonicClock();
		const countdown = Countdown.start(clock, 10_000);

		clock.advance(3_250);
		expect(countdown.remainingMs()).toBe(6_750);

		clock.advance(20_000);
		expect(countdown.remainingMs()).toBe(0);
	});

	it('RG25 — is over exactly when its duration has elapsed', () => {
		const clock = new FakeMonotonicClock();
		const countdown = Countdown.start(clock, 5_000);

		clock.advance(4_999);
		expect(countdown.isOver()).toBe(false);

		clock.advance(1);
		expect(countdown.isOver()).toBe(true);
	});

	it('RG25 — a 0 s countdown is over at once', () => {
		expect(Countdown.start(new FakeMonotonicClock(), 0).isOver()).toBe(true);
	});
});
