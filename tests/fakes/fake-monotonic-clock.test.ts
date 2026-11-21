import { describe, expect, it } from 'vitest';
import { FakeMonotonicClock } from './fake-monotonic-clock';

describe('FakeMonotonicClock', () => {
	it('stays still until the test advances it', () => {
		const clock = new FakeMonotonicClock(1_000);

		expect(clock.nowMs()).toBe(1_000);
		expect(clock.nowMs()).toBe(1_000);
	});

	it('advances to the exact millisecond', () => {
		const clock = new FakeMonotonicClock();

		clock.advance(59_999);
		clock.advance(1);

		expect(clock.nowMs()).toBe(60_000);
	});

	it('refuses to go back in time', () => {
		const clock = new FakeMonotonicClock();

		expect(() => clock.advance(-1)).toThrow(RangeError);
	});
});
