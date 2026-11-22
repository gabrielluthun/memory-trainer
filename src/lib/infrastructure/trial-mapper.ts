import type { CompletedTrial } from '../domain/trial/trial';

/** One item of a stored trial, as in `trial_items` and `trial_items_numbers` (data dictionary). */
export interface TrialItemRecord {
	position: number;
	expected_digit: number;
	answered_digit: number | null;
	is_correct: boolean | null;
}

/**
 * A closed trial as stored on the device. Same shape as the document `submit_trial` receives
 * (ADR 0010): one format from the device to the database.
 */
export interface TrialRecord {
	trial_id: string;
	discipline: string;
	mode: string;
	status: string;
	started_at: string;
	item_count: number;
	memorization_limit_ms: number;
	recall_limit_ms: number;
	memorization_ms: number;
	recall_ms: number;
	score: number | null;
	items: TrialItemRecord[];
}

/** Converts domain trials into stored records (and back, from US12). */
export class TrialMapper {
	toRecord(trial: CompletedTrial): TrialRecord {
		return {
			trial_id: trial.id,
			discipline: trial.disciplineName,
			mode: trial.mode,
			status: trial.status,
			started_at: trial.startedAt.toISOString(),
			item_count: trial.items.length,
			memorization_limit_ms: trial.format.memorizationMs,
			recall_limit_ms: trial.format.recallMs,
			memorization_ms: trial.memorizationMs,
			recall_ms: trial.recallMs,
			score: trial.score,
			items: trial.results.map((result) => ({
				position: result.position,
				expected_digit: result.expected,
				answered_digit: result.answer,
				is_correct: result.correct
			}))
		};
	}
}
