import { describe, expect, it } from 'vitest';
import { formatClock, formatCountdown, formatDuration, formatTrialDate } from './format';

describe('formatDuration — times shown on the result', () => {
	it('US01 CA4 — under a minute: seconds to the hundredth', () => {
		expect(formatDuration(48_520)).toBe('48,52 s');
		expect(formatDuration(5_000)).toBe('5,00 s');
	});

	it('US01 CA4 — from a minute: minutes, seconds and hundredths', () => {
		expect(formatDuration(201_070)).toBe('3:21,07');
		expect(formatDuration(60_000)).toBe('1:00,00');
	});

	it('ENF01 — truncates like a stopwatch, never rounds up', () => {
		expect(formatDuration(48_529)).toBe('48,52 s');
		expect(formatDuration(59_999)).toBe('59,99 s');
	});
});

describe('formatClock — running stopwatch in the trial header', () => {
	it('always shows minutes, seconds and hundredths', () => {
		expect(formatClock(41_230)).toBe('0:41,23');
		expect(formatClock(0)).toBe('0:00,00');
		expect(formatClock(60_000)).toBe('1:00,00');
	});
});

describe('formatCountdown — time left, in whole seconds', () => {
	it('RG01 — counts started seconds, so 0:00 only when the time is really up', () => {
		expect(formatCountdown(192_000)).toBe('3:12');
		expect(formatCountdown(191_001)).toBe('3:12');
		expect(formatCountdown(240_000)).toBe('4:00');
		expect(formatCountdown(1)).toBe('0:01');
		expect(formatCountdown(0)).toBe('0:00');
	});
});

describe('formatTrialDate — date of a trial in the history (mock-up 08)', () => {
	// Local times of the device, as the practitioner reads them.
	const now = new Date(2026, 10, 23, 22, 0);

	it('US12 — today and yesterday by name, with the time', () => {
		expect(formatTrialDate(new Date(2026, 10, 23, 21, 14), now)).toEqual({
			day: "Aujourd'hui",
			time: '21:14'
		});
		expect(formatTrialDate(new Date(2026, 10, 22, 8, 2), now)).toEqual({
			day: 'Hier',
			time: '08:02'
		});
	});

	it('US12 — earlier this year: day and short month', () => {
		expect(formatTrialDate(new Date(2026, 10, 19, 21, 30), now).day).toBe('19 nov.');
	});

	it('US12 — an earlier year shows the year', () => {
		expect(formatTrialDate(new Date(2025, 10, 19, 21, 30), now).day).toBe('19 nov. 2025');
	});

	it('US12 — yesterday is the previous calendar day, even less than 24 hours ago', () => {
		const justAfterMidnight = new Date(2026, 10, 23, 0, 5);

		expect(formatTrialDate(new Date(2026, 10, 22, 23, 55), justAfterMidnight).day).toBe('Hier');
	});
});
