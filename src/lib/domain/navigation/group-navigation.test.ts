import { describe, expect, it } from 'vitest';
import { FakeMonotonicClock } from '../../../../tests/fakes/fake-monotonic-clock';
import { GroupNavigation } from './group-navigation';

const navigation = (itemCount: number, pattern: number[], clock = new FakeMonotonicClock()) =>
	new GroupNavigation(itemCount, pattern, clock);

describe('GroupNavigation', () => {
	it('RG11 — splits the items into groups of the pattern size, the last one possibly shorter', () => {
		const nav = navigation(7, [3]);

		expect(nav.groupCount).toBe(3);
		expect(nav.groupBounds(0)).toEqual({ start: 0, end: 3 });
		expect(nav.groupBounds(2)).toEqual({ start: 6, end: 7 });
	});

	it('RG09 — starts on the first group', () => {
		expect(navigation(80, [2]).current).toBe(0);
	});

	it('RG09 — → moves forward one group, ← moves back one group', () => {
		const nav = navigation(80, [2]);

		nav.next();
		nav.next();
		nav.previous();

		expect(nav.current).toBe(1);
	});

	it('RG09 — ← does nothing on the first group', () => {
		const nav = navigation(80, [2]);

		nav.previous();

		expect(nav.current).toBe(0);
	});

	it('RG09 — Space or ↑ goes back to the first group', () => {
		const nav = navigation(80, [2]);
		nav.next();
		nav.next();

		nav.toStart();

		expect(nav.current).toBe(0);
	});

	it('RG09 — → twice quickly on the last group asks to finish', () => {
		const clock = new FakeMonotonicClock();
		const nav = navigation(4, [2], clock);
		nav.next();

		expect(nav.next()).toBe('stay');
		clock.advance(399);
		expect(nav.next()).toBe('finish');
	});

	it('RG09 — two presses on the last group too far apart do not finish', () => {
		const clock = new FakeMonotonicClock();
		const nav = navigation(4, [2], clock);
		nav.next();

		nav.next();
		clock.advance(400);

		expect(nav.next()).toBe('stay');
	});

	it('RG09 — the press that reaches the last group does not count towards the double press', () => {
		const clock = new FakeMonotonicClock();
		const nav = navigation(4, [2], clock);

		expect(nav.next()).toBe('moved');
		clock.advance(100);

		expect(nav.next()).toBe('stay');
	});

	it('RG11 — refuses an invalid display pattern', () => {
		expect(() => navigation(80, [])).toThrow(RangeError);
		expect(() => navigation(80, [6])).toThrow(RangeError);
	});

	it('RG11 — with the pattern "2 3", a group holds 5 digits: 80 digits make 16 groups', () => {
		const nav = navigation(80, [2, 3]);

		expect(nav.groupCount).toBe(16);
		expect(nav.groupBounds(1)).toEqual({ start: 5, end: 10 });
	});
});
