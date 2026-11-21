import { SeededRandomSource } from '../../fakes/seeded-random-source';

/** The JSON document the app sends to `submit_trial` (ADR 0010), for a Numbers trial. */
export interface NumbersTrialPayload {
	trial_id: string;
	discipline: 'numbers';
	mode: 'standard' | 'custom';
	status: 'completed' | 'abandoned' | 'external_error';
	started_at: string;
	item_count: number;
	memorization_limit_ms: number;
	recall_limit_ms: number;
	memorization_ms: number;
	recall_ms: number;
	score: number | null;
	items: {
		position: number;
		expected_digit: number;
		answered_digit: number | null;
		is_correct: boolean | null;
	}[];
}

interface Options {
	seed?: number;
	status?: NumbersTrialPayload['status'];
	/** How many digits, from the start, are answered correctly; the others are answered wrong. */
	correctCount?: number;
}

/**
 * A consistent standard Numbers trial (RG01, RG02, RG12): 80 digits, 1 minute, 4 minutes,
 * a score equal to the number of correct items. Tests then break one rule at a time.
 */
export function numbersTrial({
	seed = 1,
	status = 'completed',
	correctCount = 70
}: Options = {}): NumbersTrialPayload {
	const random = new SeededRandomSource(seed);
	const completed = status === 'completed';
	const items = Array.from({ length: 80 }, (_, index) => {
		const expected = random.nextInt(10);
		const answered = index < correctCount ? expected : (expected + 1) % 10;
		return {
			position: index + 1,
			expected_digit: expected,
			answered_digit: answered,
			is_correct: completed ? answered === expected : null
		};
	});
	return {
		trial_id: crypto.randomUUID(),
		discipline: 'numbers',
		mode: 'standard',
		status,
		started_at: '2026-11-21T10:00:00Z',
		item_count: 80,
		memorization_limit_ms: 60_000,
		recall_limit_ms: 240_000,
		memorization_ms: 58_123,
		recall_ms: 201_456,
		score: completed ? items.filter((item) => item.is_correct).length : null,
		items
	};
}
