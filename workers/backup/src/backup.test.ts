import type { PGlite } from '@electric-sql/pglite';
import { beforeEach, describe, expect, it } from 'vitest';
import { as, createAccount, createDatabase } from '../../../tests/db/support/database';
import { numbersTrial } from '../../../tests/db/support/numbers-trial';
import { CURSOR_KEY, MAX_TRIALS, runBackup, type BackupBucket, type Query } from './backup';

// CU19, SEQ06, ADR 0032: the real query, run with the read-only role of the Worker on a database
// built from the migrations. R2 is replaced by a bucket in memory.

const OWNER = 'practitioner';
const day = (date: string) => new Date(`${date}T03:00:00Z`);

/** R2 in memory: what was written, and a write that can be made to fail. */
class MemoryBucket implements BackupBucket {
	readonly files = new Map<string, string>();
	failOn: string | null = null;

	get(key: string) {
		const text = this.files.get(key);
		return Promise.resolve(text === undefined ? null : { text: () => Promise.resolve(text) });
	}

	put(key: string, value: string) {
		if (this.failOn && key.startsWith(this.failOn)) return Promise.reject(new Error('R2 down'));
		this.files.set(key, value);
		return Promise.resolve();
	}

	document(key: string): Record<string, unknown[]> & { last_sequence: number | null } {
		return JSON.parse(this.files.get(key) ?? 'null') as never;
	}
}

let db: PGlite;
let bucket: MemoryBucket;
let query: Query;

/** Trials sent by the app, as the practitioner (SEQ05). */
async function send(...seeds: number[]) {
	for (const seed of seeds) {
		await as(db, 'authenticated', OWNER, () =>
			db.query('SELECT submit_trial($1::jsonb)', [JSON.stringify(numbersTrial({ seed }))])
		);
	}
}

beforeEach(async () => {
	db = await createDatabase();
	await createAccount(db, OWNER);
	bucket = new MemoryBucket();
	query = (sql, params) =>
		as(db, 'backup_reader', null, async () => (await db.query(sql, params)).rows as never);
});

describe('runBackup — the daily file (SEQ06)', () => {
	it('first backup: every trial, with its items and sequence numbers, then the cursor', async () => {
		await send(1, 2, 3);

		const result = await runBackup({ query, bucket, now: day('2026-11-25') });

		expect(result).toEqual({ key: 'daily/2026-11-25_after-000000000.json', trials: 3, last: 3 });
		const document = bucket.document(result.key);
		expect(
			document.trials.map((trial) => (trial as { sequence_number: number }).sequence_number)
		).toEqual([1, 2, 3]);
		expect(document.trial_items).toHaveLength(240);
		expect(document.trial_items_numbers).toHaveLength(240);
		expect(document.accounts).toHaveLength(1);
		expect(document.last_sequence).toBe(3);
		expect(JSON.parse(bucket.files.get(CURSOR_KEY) ?? '')).toEqual({ last_sequence: 3 });
	});

	it('next day: only the trials received since, in a file named after the cursor', async () => {
		await send(1, 2);
		await runBackup({ query, bucket, now: day('2026-11-25') });
		await send(3);

		const result = await runBackup({ query, bucket, now: day('2026-11-26') });

		expect(result).toEqual({ key: 'daily/2026-11-26_after-000000002.json', trials: 1, last: 3 });
		expect(bucket.document(result.key).trial_items).toHaveLength(80);
	});

	it('no new trial: a file all the same, with the settings; the cursor stays', async () => {
		await send(1);
		await runBackup({ query, bucket, now: day('2026-11-25') });

		const result = await runBackup({ query, bucket, now: day('2026-11-26') });

		expect(result).toEqual({ key: 'daily/2026-11-26_after-000000001.json', trials: 0, last: 1 });
		const document = bucket.document(result.key);
		expect(document.trials).toEqual([]);
		expect(document.accounts).toHaveLength(1);
		expect(JSON.parse(bucket.files.get(CURSOR_KEY) ?? '')).toEqual({ last_sequence: 1 });
	});

	it(`at most ${MAX_TRIALS} trials a day by default: a delay is caught up the next days`, async () => {
		await send(1, 2, 3);

		const first = await runBackup({ query, bucket, now: day('2026-11-25'), limit: 2 });
		const second = await runBackup({ query, bucket, now: day('2026-11-26'), limit: 2 });

		expect([first.trials, first.last, second.trials, second.last]).toEqual([2, 2, 1, 3]);
		expect(MAX_TRIALS).toBe(100);
	});
});

describe('runBackup — failures (SEQ06)', () => {
	it('the file cannot be written: the cursor does not move, nothing is lost', async () => {
		await send(1);
		bucket.failOn = 'daily/2026';

		await expect(runBackup({ query, bucket, now: day('2026-11-25') })).rejects.toThrow('R2 down');

		expect(bucket.files.has(CURSOR_KEY)).toBe(false);
	});

	it('an unreadable cursor stops the backup instead of starting again from the beginning', async () => {
		bucket.files.set(CURSOR_KEY, 'not json');

		await expect(runBackup({ query, bucket, now: day('2026-11-25') })).rejects.toThrow();

		expect([...bucket.files.keys()]).toEqual([CURSOR_KEY]);
	});
});

describe('runBackup — nothing forgotten (deployment: a new table comes with its backup)', () => {
	it('every table the backup role can read is in the daily file', async () => {
		const result = await runBackup({ query, bucket, now: day('2026-11-25') });
		const tables = await db.query<{ table_name: string }>(
			`SELECT table_name FROM information_schema.role_table_grants
			 WHERE grantee = 'backup_reader' AND privilege_type = 'SELECT' ORDER BY table_name`
		);

		const document = bucket.document(result.key);
		for (const { table_name } of tables.rows) expect(document).toHaveProperty(table_name);
	});
});
