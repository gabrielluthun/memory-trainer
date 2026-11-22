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
			groupSize: 2,
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
});
