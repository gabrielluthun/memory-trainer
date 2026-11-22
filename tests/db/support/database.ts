import { PGlite } from '@electric-sql/pglite';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * Builds a fresh PostgreSQL database in process, exactly as production gets it:
 * the Neon prerequisites first, then every dbmate migration, in order.
 */

const migrationsDir = path.resolve(import.meta.dirname, '../../../db/migrations');
const migrationName = /^\d{14}_[a-z0-9_]+\.sql$/;

export interface Migration {
	file: string;
	up: string;
	down: string;
}

/** Splits a dbmate file into its `migrate:up` and `migrate:down` sections, like dbmate does. */
export async function loadMigrations(): Promise<Migration[]> {
	const files = (await readdir(migrationsDir)).filter((file) => file.endsWith('.sql')).sort();
	return Promise.all(
		files.map(async (file) => {
			if (!migrationName.test(file)) {
				throw new Error(`Migration file name does not follow dbmate's format: ${file}`);
			}
			const text = await readFile(path.join(migrationsDir, file), 'utf8');
			const [beforeDown, down = ''] = text.split('-- migrate:down');
			const up = beforeDown.split('-- migrate:up')[1];
			if (up === undefined) {
				throw new Error(`Migration without a "-- migrate:up" section: ${file}`);
			}
			return { file, up, down };
		})
	);
}

/**
 * What Neon provides and the migrations rely on, simulated: the `auth` schema and
 * `auth.user_id()`. Here the identity comes from the `test.user_id` setting instead of a JWT.
 */
export const neonPrerequisites = `
	CREATE SCHEMA auth;
	CREATE FUNCTION auth.user_id() RETURNS text LANGUAGE sql STABLE
		AS $$ SELECT nullif(current_setting('test.user_id', true), '') $$;
	GRANT USAGE ON SCHEMA auth TO PUBLIC;
`;

/** Each migration runs in its own transaction, as with dbmate. */
export async function applyUp(db: PGlite, migrations: Migration[]): Promise<void> {
	for (const migration of migrations) {
		await db.transaction(async (tx) => {
			await tx.exec(migration.up);
		});
	}
}

export async function applyDown(db: PGlite, migrations: Migration[]): Promise<void> {
	for (const migration of [...migrations].reverse()) {
		await db.transaction(async (tx) => {
			await tx.exec(migration.down);
		});
	}
}

export async function createDatabase(): Promise<PGlite> {
	const db = await PGlite.create();
	await db.exec(neonPrerequisites);
	await applyUp(db, await loadMigrations());
	return db;
}

/** What the CI does with db/scripts/create-account.sql, for test accounts. */
export async function createAccount(db: PGlite, ownerId: string): Promise<void> {
	await db.query('INSERT INTO accounts (owner_id) VALUES ($1) ON CONFLICT DO NOTHING', [ownerId]);
}

export type Role = 'authenticated' | 'anonymous' | 'backup_reader';

/**
 * Runs `work` as a database role, with an optional signed-in identity (the `sub` of the token).
 * Without a role switch, queries run as the owner of the tables, like the migration role.
 */
export async function as<T>(
	db: PGlite,
	role: Role,
	userId: string | null,
	work: () => Promise<T>
): Promise<T> {
	await db.query(`SELECT set_config('test.user_id', $1, false)`, [userId ?? '']);
	await db.exec(`SET ROLE ${role}`);
	try {
		return await work();
	} finally {
		await db.exec('RESET ROLE');
		await db.query(`SELECT set_config('test.user_id', '', false)`);
	}
}
