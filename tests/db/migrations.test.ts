import { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
	applyDown,
	applyUp,
	createDatabase,
	loadMigrations,
	neonPrerequisites
} from './support/database';

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

describe('display pattern migration (ADR 0027)', () => {
	it('turns a group size of 1 to 5 into the matching pattern, a larger one into the default "2"', async () => {
		const migrations = await loadMigrations();
		const initial = migrations.filter((migration) => migration.file.includes('initial_schema'));
		const rest = migrations.slice(initial.length);
		const fresh = await PGlite.create();
		await fresh.exec(neonPrerequisites);
		await applyUp(fresh, initial);
		await fresh.exec(`
			INSERT INTO accounts (owner_id) VALUES ('owner-4'), ('owner-8');
			INSERT INTO discipline_settings VALUES ('owner-4', 'numbers', 4, 0, 0), ('owner-8', 'numbers', 8, 5, 0);
		`);

		await applyUp(fresh, rest);

		const { rows } = await fresh.query<{ owner_id: string; group_pattern: number[] }>(
			'SELECT owner_id, group_pattern FROM discipline_settings ORDER BY owner_id'
		);
		expect(rows).toEqual([
			{ owner_id: 'owner-4', group_pattern: [4] },
			{ owner_id: 'owner-8', group_pattern: [2] }
		]);
		await fresh.close();
	});
});

describe('launch settings migration (ADR 0028)', () => {
	it('gives the settings already stored the standard mode and the standard Numbers format', async () => {
		const migrations = await loadMigrations();
		const index = migrations.findIndex((migration) => migration.file.includes('launch_settings'));
		const fresh = await PGlite.create();
		await fresh.exec(neonPrerequisites);
		await applyUp(fresh, migrations.slice(0, index));
		await fresh.exec(`
			INSERT INTO accounts (owner_id) VALUES ('owner-1');
			INSERT INTO discipline_settings VALUES ('owner-1', 'numbers', 5, 0, '{2}');
		`);

		await applyUp(fresh, migrations.slice(index));

		const { rows } = await fresh.query(
			'SELECT launch_mode, custom_item_count, custom_memorization_s FROM discipline_settings'
		);
		expect(rows).toEqual([
			{ launch_mode: 'standard', custom_item_count: 80, custom_memorization_s: 60 }
		]);
		await fresh.close();
	});
});
