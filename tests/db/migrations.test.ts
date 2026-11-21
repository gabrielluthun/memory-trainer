import { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { applyDown, applyUp, createDatabase, loadMigrations } from './support/database';

// ES19: every migration applies on an empty database, and its "down" section undoes it
// (used on the local machine and the dev branch only).

let db: PGlite;

beforeAll(async () => {
	db = await createDatabase();
});

afterAll(async () => {
	await db.close();
});

const publicTableCount = async () => {
	const { rows } = await db.query<{ n: number }>(
		`SELECT count(*)::int AS n FROM pg_tables WHERE schemaname = 'public'`
	);
	return rows[0].n;
};

describe('migrations', () => {
	it('create the 6 tables of lot 1', async () => {
		expect(await publicTableCount()).toBe(6);
	});

	it('can be undone, then applied again', async () => {
		const migrations = await loadMigrations();

		await applyDown(db, migrations);
		expect(await publicTableCount()).toBe(0);

		await applyUp(db, migrations);
		expect(await publicTableCount()).toBe(6);
	});
});
