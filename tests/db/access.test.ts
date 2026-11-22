import type { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { as, createAccount, createDatabase } from './support/database';
import { numbersTrial } from './support/numbers-trial';

// The access cases of docs/04-specifications/acces.md (section 6), plus the global checks of
// docs/05-securite/bdd.md (section 8): no table without RLS, no function executable by everyone,
// every table readable by the backup role (ES04, ADR 0018).

let db: PGlite;

const count = async (sql: string) => {
	const { rows } = await db.query<{ n: number }>(`SELECT count(*)::int AS n FROM (${sql}) AS q`);
	return rows[0].n;
};

beforeAll(async () => {
	db = await createDatabase();
	await createAccount(db, 'owner-1');
	await createAccount(db, 'owner-2');
	const upload = (ownerId: string, seed: number) =>
		as(db, 'authenticated', ownerId, () =>
			db.query('SELECT submit_trial($1::jsonb)', [JSON.stringify(numbersTrial({ seed }))])
		);
	await upload('owner-1', 1);
	await upload('owner-1', 2);
	await upload('owner-2', 3);
});

afterAll(async () => {
	await db.close();
});

describe('authenticated: each owner only sees their own rows', () => {
	it('owner-1 sees their 2 trials and 160 items', async () => {
		await as(db, 'authenticated', 'owner-1', async () => {
			expect(await count('SELECT * FROM trials')).toBe(2);
			expect(await count('SELECT * FROM trial_items')).toBe(160);
			expect(await count('SELECT * FROM trial_items_numbers')).toBe(160);
			expect(await count('SELECT * FROM accounts')).toBe(1);
		});
	});

	it('owner-2 sees their single trial', async () => {
		await as(db, 'authenticated', 'owner-2', async () => {
			expect(await count('SELECT * FROM trials')).toBe(1);
		});
	});

	it('an unknown identity sees no trial', async () => {
		await as(db, 'authenticated', 'stranger', async () => {
			expect(await count('SELECT * FROM trials')).toBe(0);
			expect(await count('SELECT * FROM accounts')).toBe(0);
		});
	});

	it('everyone signed in reads the disciplines (reference data)', async () => {
		await as(db, 'authenticated', 'stranger', async () => {
			expect(await count('SELECT * FROM disciplines')).toBe(1);
		});
	});

	it('owner-1 cannot insert a trial in the name of owner-2', async () => {
		const trial = numbersTrial({ seed: 9 });
		await expect(
			as(db, 'authenticated', 'owner-1', () =>
				db.query(
					`INSERT INTO trials (trial_id, owner_id, discipline, mode, status, started_at, item_count,
						memorization_limit_ms, recall_limit_ms, memorization_ms, recall_ms, score)
					 VALUES ($1, 'owner-2', 'numbers', 'standard', 'completed', now(), 80, 60000, 240000, 1000, 1000, 0)`,
					[trial.trial_id]
				)
			)
		).rejects.toThrow(/row-level security/);
	});

	it('cannot write accounts directly', async () => {
		await expect(
			as(db, 'authenticated', 'owner-1', () =>
				db.query(`UPDATE accounts SET interface_language = 'en'`)
			)
		).rejects.toThrow(/permission denied/);
	});

	it('cannot write discipline settings directly', async () => {
		await expect(
			as(db, 'authenticated', 'owner-1', () =>
				db.query(
					`INSERT INTO discipline_settings (owner_id, discipline, group_pattern, pause_before_memorization_s, pause_before_recall_s)
					 VALUES ('owner-1', 'numbers', '{3}', 0, 0)`
				)
			)
		).rejects.toThrow(/permission denied/);
	});

	it('cannot update or delete a trial: no privilege', async () => {
		await as(db, 'authenticated', 'owner-1', async () => {
			await expect(db.query('UPDATE trials SET score = 0')).rejects.toThrow(/permission denied/);
			await expect(db.query('DELETE FROM trials')).rejects.toThrow(/permission denied/);
		});
	});
});

describe('anonymous: nothing at all', () => {
	it('cannot read any table', async () => {
		await as(db, 'anonymous', null, async () => {
			for (const table of ['accounts', 'disciplines', 'trials', 'trial_items']) {
				await expect(db.query(`SELECT * FROM ${table}`)).rejects.toThrow(/permission denied/);
			}
		});
	});

	it('cannot call submit_trial', async () => {
		await expect(
			as(db, 'anonymous', null, () =>
				db.query('SELECT submit_trial($1::jsonb)', [JSON.stringify(numbersTrial({ seed: 4 }))])
			)
		).rejects.toThrow(/permission denied/);
	});
});

describe('backup_reader: reads everything, writes nothing', () => {
	it('sees every trial and every digit', async () => {
		await as(db, 'backup_reader', null, async () => {
			expect(await count('SELECT * FROM trials')).toBe(3);
			expect(await count('SELECT * FROM trial_items_numbers')).toBe(240);
			expect(await count('SELECT * FROM accounts')).toBe(2);
		});
	});

	it('cannot write', async () => {
		await expect(
			as(db, 'backup_reader', null, () => db.query(`INSERT INTO disciplines VALUES ('cards')`))
		).rejects.toThrow(/permission denied/);
	});

	it('cannot call a function', async () => {
		await expect(
			as(db, 'backup_reader', null, () =>
				db.query('SELECT save_settings($1::jsonb)', [JSON.stringify({})])
			)
		).rejects.toThrow(/permission denied/);
	});
});

describe('global checks, run on every new table of the next lots', () => {
	const publicTables = `
		SELECT c.oid, c.relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
		WHERE n.nspname = 'public' AND c.relkind = 'r'`;

	it('ES04 — no table without RLS', async () => {
		const { rows } = await db.query<{ relname: string }>(
			`SELECT relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
			 WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity`
		);
		expect(rows).toEqual([]);
	});

	it('ES04 — every table has a rule for the app role', async () => {
		const { rows } = await db.query<{ relname: string }>(
			`SELECT t.relname FROM (${publicTables}) t
			 WHERE NOT EXISTS (SELECT 1 FROM pg_policies p
				WHERE p.schemaname = 'public' AND p.tablename = t.relname AND 'authenticated' = ANY (p.roles))`
		);
		expect(rows).toEqual([]);
	});

	it('no function of the app is executable by anonymous or by everyone', async () => {
		const { rows } = await db.query<{ proname: string }>(
			`SELECT p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
			 WHERE n.nspname = 'public' AND has_function_privilege('anonymous', p.oid, 'EXECUTE')`
		);
		expect(rows).toEqual([]);
	});

	it('ADR 0018 — every table is readable by the backup role', async () => {
		const { rows } = await db.query<{ relname: string }>(
			`SELECT t.relname FROM (${publicTables}) t
			 WHERE NOT has_table_privilege('backup_reader', t.oid, 'SELECT')
			    OR NOT EXISTS (SELECT 1 FROM pg_policies p
				WHERE p.schemaname = 'public' AND p.tablename = t.relname
				  AND p.cmd = 'SELECT' AND 'backup_reader' = ANY (p.roles))`
		);
		expect(rows).toEqual([]);
	});
});
