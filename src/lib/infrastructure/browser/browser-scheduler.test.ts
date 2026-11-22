import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BrowserScheduler } from './browser-scheduler';

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
});

describe('BrowserScheduler', () => {
	it('runs a task after its delay', () => {
		const ran: string[] = [];
		new BrowserScheduler().after(1_000, () => ran.push('done'));

		vi.advanceTimersByTime(999);
		expect(ran).toEqual([]);

		vi.advanceTimersByTime(1);
		expect(ran).toEqual(['done']);
	});

	it('never runs a cancelled task', () => {
		const ran: string[] = [];
		const cancel = new BrowserScheduler().after(1_000, () => ran.push('done'));

		cancel();
		vi.advanceTimersByTime(5_000);

		expect(ran).toEqual([]);
	});
});
