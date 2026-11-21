import { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// Sprint 0 smoke test: PostgreSQL runs in process, with roles and row-level security.
// The real schema comes from the dbmate migrations (next step).

let db: PGlite;

beforeAll(async () => {
	db = await PGlite.create();
});

afterAll(async () => {
	await db.close();
});

describe('PGlite', () => {
	it('runs PostgreSQL 16 or later', async () => {
		const { rows } = await db.query<{ server_version_num: string }>('SHOW server_version_num');

		expect(Number(rows[0].server_version_num)).toBeGreaterThanOrEqual(160_000);
	});

	it('enforces row-level security for a non-owner role', async () => {
		await db.exec(`
			CREATE TABLE notes (owner_id text NOT NULL, body text NOT NULL);
			ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
			CREATE ROLE reader;
			GRANT SELECT ON notes TO reader;
			CREATE POLICY own_notes ON notes FOR SELECT TO reader
				USING (owner_id = current_setting('test.user_id', true));
			INSERT INTO notes VALUES ('owner-1', 'mine'), ('owner-2', 'not mine');
		`);

		await db.exec(`SET test.user_id = 'owner-1'; SET ROLE reader;`);
		const { rows } = await db.query<{ body: string }>('SELECT body FROM notes');
		await db.exec('RESET ROLE');

		expect(rows).toEqual([{ body: 'mine' }]);
	});
});
