/**
 * The daily backup (CU19, SEQ06, ADR 0032): the trials received since the last backup, at most 100,
 * and the settings, as the raw rows of each table, sequence numbers included (ADR 0011).
 *
 * The Worker has 10 ms of computing time: PostgreSQL builds the JSON document, and the Worker
 * hands it to R2 as it is, without going through it.
 */

/** Trials per backup: a delay is caught up over the next days, never in one too large run. */
export const MAX_TRIALS = 100;
/** The last sequence number backed up, kept in R2: the Worker cannot write to the database (ES11). */
export const CURSOR_KEY = 'daily/cursor.json';

/** A read-only query, with the `backup_reader` role. */
export type Query = (sql: string, params: unknown[]) => Promise<Record<string, unknown>[]>;

/** What the backup needs from the R2 bucket. */
export interface BackupBucket {
	get(key: string): Promise<{ text(): Promise<string> } | null>;
	put(key: string, value: string): Promise<unknown>;
}

export interface BackupResult {
	/** The file written in R2. */
	key: string;
	/** Trials in this file. */
	trials: number;
	/** The cursor after this backup. */
	last: number;
}

/**
 * The whole document, built by the database. Trials after the cursor, by sequence number; their
 * items; and every other table in full (settings, reference data). A new table comes with its line
 * here: a test checks that every table the backup role can read is in the document.
 */
const DOCUMENT = `
WITH batch AS (
	SELECT * FROM trials WHERE sequence_number > $1::bigint ORDER BY sequence_number LIMIT $2::int
)
SELECT
	json_build_object(
		'format', 1,
		'after_sequence', $1::bigint,
		'last_sequence', (SELECT max(sequence_number) FROM batch),
		'trials', coalesce((SELECT json_agg(b ORDER BY b.sequence_number) FROM batch b), '[]'),
		'trial_items', coalesce((
			SELECT json_agg(i ORDER BY i.trial_id, i.position) FROM trial_items i
			WHERE i.trial_id IN (SELECT trial_id FROM batch)
		), '[]'),
		'trial_items_numbers', coalesce((
			SELECT json_agg(n ORDER BY n.trial_id, n.position) FROM trial_items_numbers n
			WHERE n.trial_id IN (SELECT trial_id FROM batch)
		), '[]'),
		'accounts', coalesce((SELECT json_agg(a) FROM accounts a), '[]'),
		'discipline_settings', coalesce((SELECT json_agg(d) FROM discipline_settings d), '[]'),
		'disciplines', coalesce((SELECT json_agg(d) FROM disciplines d), '[]')
	)::text AS document,
	(SELECT count(*) FROM batch)::int AS trial_count,
	(SELECT max(sequence_number) FROM batch) AS last_sequence
`;

/** The cursor in R2; 0 before the first backup. A damaged cursor stops the backup. */
async function readCursor(bucket: BackupBucket): Promise<number> {
	const file = await bucket.get(CURSOR_KEY);
	if (!file) return 0;
	const { last_sequence } = JSON.parse(await file.text()) as { last_sequence?: unknown };
	if (typeof last_sequence !== 'number' || !Number.isInteger(last_sequence) || last_sequence < 0) {
		throw new Error('Backup cursor unreadable');
	}
	return last_sequence;
}

export async function runBackup({
	query,
	bucket,
	now,
	limit = MAX_TRIALS
}: {
	query: Query;
	bucket: BackupBucket;
	/** The time of the scheduled run: its date names the file. */
	now: Date;
	limit?: number;
}): Promise<BackupResult> {
	const after = await readCursor(bucket);
	const [row] = await query(DOCUMENT, [after, limit]);
	const trials = Number(row.trial_count);
	const last = trials > 0 ? Number(row.last_sequence) : after;
	// Named after the cursor: two runs on the same day never overwrite other trials.
	const key = `daily/${now.toISOString().slice(0, 10)}_after-${String(after).padStart(9, '0')}.json`;
	await bucket.put(key, String(row.document));
	// Only once the file is written: a failure loses nothing, the next run starts again here.
	if (trials > 0) await bucket.put(CURSOR_KEY, JSON.stringify({ last_sequence: last }));
	return { key, trials, last };
}
