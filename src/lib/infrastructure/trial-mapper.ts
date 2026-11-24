import type { TrialDetail, TrialSummary } from '../application/ports';
import type { DisciplineName } from '../domain/disciplines/discipline';
import type { ClosedTrial, Mode } from '../domain/trial/trial';

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
	/** Refused by the database (ES07); set on the device only, never sent. */
	rejected?: boolean;
}

/** Converts domain trials into stored records, and stored records into what the history reads. */
/** Numbers digits of an item, embedded one-to-one: an object, sometimes a one-element list. */
type ApiNumbers = { expected_digit: number; answered_digit: number | null };

/** A trial as the Data API returns it: the row of `trials`, its items embedded (SEQ05). */
export interface ApiTrialRow extends Omit<TrialRecord, 'items' | 'rejected'> {
	sequence_number: number;
	trial_items: {
		position: number;
		is_correct: boolean | null;
		trial_items_numbers: ApiNumbers | ApiNumbers[] | null;
	}[];
}

export class TrialMapper {
	/** A completed trial carries its score and its correction; an excluded one has neither (RG23). */
	toRecord(trial: ClosedTrial): TrialRecord {
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
			score: trial.phase === 'completed' ? trial.score : null,
			items:
				trial.phase === 'completed'
					? trial.results.map((result) => ({
							position: result.position,
							expected_digit: result.expected,
							answered_digit: result.answer,
							is_correct: result.correct
						}))
					: trial.items.map((expected, index) => ({
							position: index + 1,
							expected_digit: expected,
							answered_digit: trial.answers[index] ?? null,
							is_correct: null
						}))
		};
	}
	/**
	 * A trial received from another device, back in its stored form (RG19). Its start date is
	 * written like the local ones, so the history sorts them together (RG22).
	 */
	fromApi(row: ApiTrialRow): TrialRecord {
		const items = [...row.trial_items]
			.sort((a, b) => a.position - b.position)
			.map((item) => {
				const numbers = [item.trial_items_numbers].flat()[0];
				return {
					position: item.position,
					expected_digit: numbers?.expected_digit ?? 0,
					answered_digit: numbers?.answered_digit ?? null,
					is_correct: item.is_correct
				};
			});
		return {
			trial_id: row.trial_id,
			discipline: row.discipline,
			mode: row.mode,
			status: row.status,
			started_at: new Date(row.started_at).toISOString(),
			item_count: row.item_count,
			memorization_limit_ms: row.memorization_limit_ms,
			recall_limit_ms: row.recall_limit_ms,
			memorization_ms: row.memorization_ms,
			recall_ms: row.recall_ms,
			score: row.score,
			items
		};
	}

	/** What the history lists (US12): no item, the list stays light. */
	toSummary(record: TrialRecord): TrialSummary {
		return {
			id: record.trial_id,
			discipline: record.discipline as DisciplineName,
			mode: record.mode as Mode,
			status: record.status,
			startedAt: new Date(record.started_at),
			itemCount: record.item_count,
			score: record.score,
			memorizationMs: record.memorization_ms,
			rejected: record.rejected === true
		};
	}

	/** One trial with its detail, item by item (US11, RG19). */
	toDetail(record: TrialRecord): TrialDetail {
		return {
			...this.toSummary(record),
			recallMs: record.recall_ms,
			results: record.items.map((item) => ({
				position: item.position,
				expected: item.expected_digit,
				answer: item.answered_digit,
				correct: item.is_correct === true
			}))
		};
	}
}
