import { describe, expect, it } from 'vitest';
import { FakeMonotonicClock } from '../../../../tests/fakes/fake-monotonic-clock';
import { NumbersDiscipline } from '../disciplines/numbers';
import { PausedBeforeMemorization, type TrialSetup } from './trial';

const numbers = new NumbersDiscipline();

const setup = (items: number[] = [1, 2, 3, 4, 5, 6, 7, 8]): TrialSetup => ({
	id: '0b9f4c52-1b0e-4a51-9a3e-2f3c8a1d7e90',
	discipline: numbers,
	mode: 'standard',
	format: { itemCount: items.length, memorizationMs: 60_000, recallMs: 240_000 },
	pauses: { beforeMemorizationMs: 0, beforeRecallMs: 0 },
	displayPattern: [2],
	items,
	startedAt: new Date('2026-11-22T10:00:00Z')
});

describe('PausedBeforeMemorization', () => {
	it('RG25 — a 0 s pause is over at once', () => {
		const paused = PausedBeforeMemorization.begin(setup(), new FakeMonotonicClock());

		expect(paused.countdown.isOver()).toBe(true);
	});

	it('RG25 — counts down the planned pause before memorization', () => {
		const clock = new FakeMonotonicClock();
		const paused = PausedBeforeMemorization.begin(
			{ ...setup(), pauses: { beforeMemorizationMs: 10_000, beforeRecallMs: 0 } },
			clock
		);

		clock.advance(4_000);

		expect(paused.countdown.remainingMs()).toBe(6_000);
	});
});

describe('MemorizingTrial', () => {
	it('ENF01 — times the memorization from the moment it starts', () => {
		const clock = new FakeMonotonicClock();
		const paused = PausedBeforeMemorization.begin(setup(), clock);
		clock.advance(5_000);

		const memorizing = paused.startMemorization();
		clock.advance(12_345);

		expect(memorizing.elapsedMs()).toBe(12_345);
	});

	it('RG01 — the memorization time is up after exactly 1 minute', () => {
		const clock = new FakeMonotonicClock();
		const memorizing = PausedBeforeMemorization.begin(setup(), clock).startMemorization();

		clock.advance(59_999);
		expect(memorizing.isTimeUp()).toBe(false);

		clock.advance(1);
		expect(memorizing.isTimeUp()).toBe(true);
	});

	it('RG08 — finishing early records the time really used', () => {
		const clock = new FakeMonotonicClock();
		const memorizing = PausedBeforeMemorization.begin(setup(), clock).startMemorization();
		clock.advance(25_340);

		expect(memorizing.finishMemorization().memorizationMs).toBe(25_340);
	});

	it('RG01 — a late stop never records more than the format allows', () => {
		const clock = new FakeMonotonicClock();
		const memorizing = PausedBeforeMemorization.begin(setup(), clock).startMemorization();
		clock.advance(60_120);

		expect(memorizing.finishMemorization().memorizationMs).toBe(60_000);
	});
});

describe('MemorizingTrial — navigation (US07)', () => {
	it('RG11 — navigates groups of the display pattern chosen at launch', () => {
		const memorizing = PausedBeforeMemorization.begin(
			{ ...setup([1, 2, 3, 4, 5, 6, 7, 8]), displayPattern: [3] },
			new FakeMonotonicClock()
		).startMemorization();

		memorizing.navigation.next();

		expect(memorizing.navigation.groupCount).toBe(3);
		expect(memorizing.currentGroup()).toEqual([4, 5, 6]);
	});

	it('RG11 — with the pattern "2 3", the frame holds 5 digits', () => {
		const memorizing = PausedBeforeMemorization.begin(
			{ ...setup([1, 2, 3, 4, 5, 6, 7, 8]), displayPattern: [2, 3] },
			new FakeMonotonicClock()
		).startMemorization();

		expect(memorizing.currentGroup()).toEqual([1, 2, 3, 4, 5]);
		expect(memorizing.navigation.groupCount).toBe(2);
	});
});

describe('PausedBeforeRecall', () => {
	it('RG25 — the pause before recall does not count in the memorization time', () => {
		const clock = new FakeMonotonicClock();
		const memorizing = PausedBeforeMemorization.begin(
			{ ...setup(), pauses: { beforeMemorizationMs: 0, beforeRecallMs: 20_000 } },
			clock
		).startMemorization();
		clock.advance(30_000);

		const paused = memorizing.finishMemorization();
		clock.advance(20_000);

		expect(paused.memorizationMs).toBe(30_000);
		expect(paused.countdown.isOver()).toBe(true);
	});
});

describe('CompletedTrial — ranking (US07 CA4)', () => {
	const completed = (correctTyped: number[], memorizationMs: number) => {
		const clock = new FakeMonotonicClock();
		const memorizing = PausedBeforeMemorization.begin(setup([1, 2, 3]), clock).startMemorization();
		clock.advance(memorizationMs);
		const recalling = memorizing.finishMemorization().startRecall();
		correctTyped.forEach((digit) => recalling.recall.type(digit));
		return recalling.finishRecall();
	};

	it('RG13 — a higher score always wins, even with a longer time (10 in 60 s beats 9 in 30 s)', () => {
		expect(completed([1, 2], 60_000).isBetterThan(completed([1], 30_000))).toBe(true);
		expect(completed([1], 30_000).isBetterThan(completed([1, 2], 60_000))).toBe(false);
	});

	it('RG13 — at equal score, the shorter memorization wins', () => {
		expect(completed([1], 20_000).isBetterThan(completed([1], 25_000))).toBe(true);
		expect(completed([1], 25_000).isBetterThan(completed([1], 20_000))).toBe(false);
	});

	it('RG13 — same score and same time: neither is better', () => {
		expect(completed([1], 20_000).isBetterThan(completed([1], 20_000))).toBe(false);
	});
});

describe('RecallingTrial', () => {
	const recallingWith = (clock: FakeMonotonicClock, items?: number[]) => {
		const memorizing = PausedBeforeMemorization.begin(setup(items), clock).startMemorization();
		clock.advance(40_000);
		return memorizing.finishMemorization().startRecall();
	};

	it('RG10 — offers one blank cell per item drawn', () => {
		const recalling = recallingWith(new FakeMonotonicClock(), [5, 5, 5]);

		expect(recalling.recall.answers()).toEqual([null, null, null]);
	});

	it('RG01 — the recall time is up after exactly 4 minutes', () => {
		const clock = new FakeMonotonicClock();
		const recalling = recallingWith(clock);

		clock.advance(239_999);
		expect(recalling.isTimeUp()).toBe(false);

		clock.advance(1);
		expect(recalling.isTimeUp()).toBe(true);
	});

	it('RG12 — finishing the recall scores the answers given', () => {
		const clock = new FakeMonotonicClock();
		const recalling = recallingWith(clock, [1, 2, 3, 4]);
		recalling.recall.type(1);
		recalling.recall.type(9);
		recalling.recall.type(3);

		const completed = recalling.finishRecall();

		expect(completed.score).toBe(2);
		expect(completed.answers).toEqual([1, 9, 3, null]);
	});

	it('RG01, RG08 — records both times, the recall one capped at 4 minutes', () => {
		const clock = new FakeMonotonicClock();
		const recalling = recallingWith(clock);
		clock.advance(240_500);

		const completed = recalling.finishRecall();

		expect(completed.memorizationMs).toBe(40_000);
		expect(completed.recallMs).toBe(240_000);
	});

	it('RG19 — the completed trial keeps every item with its answer and its result', () => {
		const clock = new FakeMonotonicClock();
		const recalling = recallingWith(clock, [7, 0]);
		recalling.recall.type(7);

		const completed = recalling.finishRecall();

		expect(completed).toMatchObject({
			id: '0b9f4c52-1b0e-4a51-9a3e-2f3c8a1d7e90',
			discipline: numbers,
			mode: 'standard',
			status: 'completed',
			items: [7, 0],
			startedAt: new Date('2026-11-22T10:00:00Z')
		});
		expect(completed.results).toEqual([
			{ position: 1, expected: 7, answer: 7, correct: true },
			{ position: 2, expected: 0, answer: null, correct: false }
		]);
	});
});
