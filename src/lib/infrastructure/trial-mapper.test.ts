import { describe, expect, it } from 'vitest';
import { FakeMonotonicClock } from '../../../tests/fakes/fake-monotonic-clock';
import { NumbersDiscipline } from '../domain/disciplines/numbers';
import { PausedBeforeMemorization } from '../domain/trial/trial';
import { TrialMapper } from './trial-mapper';

const completedTrial = () => {
	const clock = new FakeMonotonicClock();
	const memorizing = PausedBeforeMemorization.begin(
		{
			id: '0b9f4c52-1b0e-4a51-9a3e-2f3c8a1d7e90',
			discipline: new NumbersDiscipline(),
			mode: 'standard',
			format: { itemCount: 2, memorizationMs: 60_000, recallMs: 240_000 },
			pauses: { beforeMemorizationMs: 0, beforeRecallMs: 0 },
			displayPattern: [2],
			items: [7, 0],
			startedAt: new Date('2026-11-22T10:00:00Z')
		},
		clock
	).startMemorization();
	clock.advance(40_000);
	const recalling = memorizing.finishMemorization().startRecall();
	recalling.recall.type(7);
	clock.advance(30_000);
	return recalling.finishRecall();
};

/** The same trial, abandoned during recall and kept out of the statistics (RG23). */
const abandonedTrial = () => {
	const clock = new FakeMonotonicClock();
	const memorizing = PausedBeforeMemorization.begin(
		{
			id: '5d1c2b7e-8f4a-4c3d-9e2b-1a0f6c7d8e9f',
			discipline: new NumbersDiscipline(),
			mode: 'standard',
			format: { itemCount: 2, memorizationMs: 60_000, recallMs: 240_000 },
			pauses: { beforeMemorizationMs: 0, beforeRecallMs: 0 },
			displayPattern: [2],
			items: [7, 0],
			startedAt: new Date('2026-11-22T10:00:00Z')
		},
		clock
	).startMemorization();
	clock.advance(40_000);
	const recalling = memorizing.finishMemorization().startRecall();
	recalling.recall.type(7);
	clock.advance(10_000);
	return recalling.abandon().keepOutOfStats();
};

describe('TrialMapper', () => {
	it('ADR 0010 — turns a completed trial into the document submit_trial expects', () => {
		expect(new TrialMapper().toRecord(completedTrial())).toEqual({
			trial_id: '0b9f4c52-1b0e-4a51-9a3e-2f3c8a1d7e90',
			discipline: 'numbers',
			mode: 'standard',
			status: 'completed',
			started_at: '2026-11-22T10:00:00.000Z',
			item_count: 2,
			memorization_limit_ms: 60_000,
			recall_limit_ms: 240_000,
			memorization_ms: 40_000,
			recall_ms: 30_000,
			score: 1,
			items: [
				{ position: 1, expected_digit: 7, answered_digit: 7, is_correct: true },
				{ position: 2, expected_digit: 0, answered_digit: null, is_correct: false }
			]
		});
	});

	it('RG22 — the start date is an instant in universal time, whatever the device time zone', () => {
		const record = new TrialMapper().toRecord(completedTrial());

		expect(record.started_at.endsWith('Z')).toBe(true);
	});

	it('US12 — reads a stored trial back as a summary for the history', () => {
		const mapper = new TrialMapper();

		expect(mapper.toSummary(mapper.toRecord(completedTrial()))).toEqual({
			id: '0b9f4c52-1b0e-4a51-9a3e-2f3c8a1d7e90',
			discipline: 'numbers',
			mode: 'standard',
			status: 'completed',
			startedAt: new Date('2026-11-22T10:00:00Z'),
			itemCount: 2,
			score: 1,
			memorizationMs: 40_000
		});
	});

	it('US11, US12 — reads a stored trial back with its detail, item by item', () => {
		const mapper = new TrialMapper();

		const detail = mapper.toDetail(mapper.toRecord(completedTrial()));

		expect(detail.recallMs).toBe(30_000);
		expect(detail.results).toEqual([
			{ position: 1, expected: 7, answer: 7, correct: true },
			{ position: 2, expected: 0, answer: null, correct: false }
		]);
	});

	it('US12 — the summary carries no item, the list stays light', () => {
		const mapper = new TrialMapper();

		expect(mapper.toSummary(mapper.toRecord(completedTrial()))).not.toHaveProperty('results');
	});

	it('RG23, data dictionary — an abandoned trial is stored without a score nor any "juste"', () => {
		expect(new TrialMapper().toRecord(abandonedTrial())).toMatchObject({
			status: 'abandoned',
			memorization_ms: 40_000,
			recall_ms: 10_000,
			score: null,
			items: [
				{ position: 1, expected_digit: 7, answered_digit: 7, is_correct: null },
				{ position: 2, expected_digit: 0, answered_digit: null, is_correct: null }
			]
		});
	});
});
