import type { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { as, createAccount, createDatabase } from './support/database';
import { numbersTrial, type NumbersTrialPayload } from './support/numbers-trial';

// The 14 integrity cases of the physical model (docs/04-specifications/bdd/mpd.md, section 8),
// played with the app role, as the Data API would (ES05, ES06, ES07, RG12, RG18, RG22).

const OWNER = 'owner-1';
let db: PGlite;

const submit = (trial: NumbersTrialPayload, userId: string | null = OWNER) =>
	as(db, 'authenticated', userId, async () => {
		const { rows } = await db.query<{ result: string }>(
			'SELECT submit_trial($1::jsonb) AS result',
			[JSON.stringify(trial)]
		);
		return rows[0].result;
	});

const saveSettings = (modifiedAt: string, language: 'fr' | 'en', groupPattern: number[]) =>
	as(db, 'authenticated', OWNER, async () => {
		const settings = {
			settings_modified_at: modifiedAt,
			interface_language: language,
			disciplines: [
				{
					discipline: 'numbers',
					group_pattern: groupPattern,
					pause_before_memorization_s: 5,
					pause_before_recall_s: 10
				}
			]
		};
		const { rows } = await db.query<{ result: string }>(
			'SELECT save_settings($1::jsonb) AS result',
			[JSON.stringify(settings)]
		);
		return rows[0].result;
	});

const countTrials = async (trialId: string) => {
	const { rows } = await db.query<{ n: number }>(
		'SELECT count(*)::int AS n FROM trials WHERE trial_id = $1',
		[trialId]
	);
	return rows[0].n;
};

beforeAll(async () => {
	db = await createDatabase();
	await createAccount(db, OWNER);
});

afterAll(async () => {
	await db.close();
});

describe('submit_trial accepts consistent trials', () => {
	it('accepts a complete and consistent Numbers trial', async () => {
		const trial = numbersTrial();

		expect(await submit(trial)).toBe('inserted');
		expect(await countTrials(trial.trial_id)).toBe(1);
	});

	it('RG22 — ignores the same trial sent twice (ES06)', async () => {
		const trial = numbersTrial();

		expect(await submit(trial)).toBe('inserted');
		expect(await submit(trial)).toBe('duplicate');
		expect(await countTrials(trial.trial_id)).toBe(1);
	});

	it('RG23 — accepts an abandoned trial, without score nor "correct" flags', async () => {
		const trial = numbersTrial({ status: 'abandoned' });

		expect(await submit(trial)).toBe('inserted');
	});
});

describe('submit_trial refuses inconsistent trials (ES07)', () => {
	it('refuses 79 items instead of 80', async () => {
		const trial = numbersTrial();
		trial.items.pop();

		await expect(submit(trial)).rejects.toThrow(/80 items expected, 79 found/);
	});

	it('RG12 — refuses a score different from the number of correct items', async () => {
		const trial = numbersTrial({ correctCount: 70 });
		trial.score = 71;

		await expect(submit(trial)).rejects.toThrow(/score 71 but 70 correct items/);
	});

	it('RG12 — refuses an item marked correct with a wrong answer', async () => {
		const trial = numbersTrial({ correctCount: 70 });
		trial.items[79].is_correct = true;
		trial.score = 71;

		await expect(submit(trial)).rejects.toThrow(/inconsistent is_correct/);
	});

	it('RG02 — refuses a digit outside 0 to 9', async () => {
		const trial = numbersTrial();
		trial.items[0].expected_digit = 12;

		await expect(submit(trial)).rejects.toThrow(/check constraint/);
	});

	it('ES01 — refuses a trial from an unknown account', async () => {
		await expect(submit(numbersTrial(), 'stranger')).rejects.toThrow(/foreign key/);
	});

	it('refuses an item added directly to an existing trial', async () => {
		const trial = numbersTrial();
		await submit(trial);

		await expect(
			as(db, 'authenticated', OWNER, () =>
				db.query(
					'INSERT INTO trial_items (trial_id, position, is_correct) VALUES ($1, 81, false)',
					[trial.trial_id]
				)
			)
		).rejects.toThrow(/80 items expected, 81 found/);
	});
});

describe('RG18 — closed trials are immutable, even for the owner of the tables (ES05)', () => {
	let trialId: string;

	beforeAll(async () => {
		const trial = numbersTrial();
		await submit(trial);
		trialId = trial.trial_id;
	});

	it('refuses an update of a trial', async () => {
		await expect(
			db.query('UPDATE trials SET score = 80 WHERE trial_id = $1', [trialId])
		).rejects.toThrow(/trials are immutable/);
	});

	it('refuses a deletion of items', async () => {
		await expect(
			db.query('DELETE FROM trial_items WHERE trial_id = $1', [trialId])
		).rejects.toThrow(/trials are immutable/);
	});

	it('refuses emptying the trial tables', async () => {
		await expect(db.exec('TRUNCATE trials, trial_items, trial_items_numbers')).rejects.toThrow(
			/trials are immutable/
		);
	});
});

describe('save_settings keeps the most recent change (ADR 0012)', () => {
	it('saves a newer change, then ignores an older one', async () => {
		expect(await saveSettings('2026-11-21T10:00:00Z', 'en', [2, 3])).toBe('saved');
		expect(await saveSettings('2026-11-21T09:00:00Z', 'fr', [2])).toBe('ignored');

		const { rows } = await db.query<{ interface_language: string; group_pattern: number[] }>(`
			SELECT a.interface_language, s.group_pattern
			FROM accounts a JOIN discipline_settings s USING (owner_id)
			WHERE owner_id = 'owner-1'
		`);
		expect(rows).toEqual([{ interface_language: 'en', group_pattern: [2, 3] }]);
	});
});

describe('display pattern (RG11, ADR 0027)', () => {
	const later = (minutes: number) => new Date(Date.UTC(2026, 10, 22, 12, minutes)).toISOString();

	it.each([[[5]], [[1, 1, 1]], [[5, 5, 5]]])('ES07 — accepts the pattern %j', async (pattern) => {
		expect(await saveSettings(later(pattern.length * 10 + pattern[0]), 'fr', pattern)).toBe(
			'saved'
		);
	});

	it.each([[[]], [[6]], [[0]], [[2, 2, 2, 2]]])(
		'ES07 — refuses the pattern %j',
		async (pattern) => {
			await expect(saveSettings(later(59), 'fr', pattern)).rejects.toThrow(/check constraint/);
		}
	);
});

describe('sequence numbers (ADR 0011)', () => {
	it('increase with each accepted trial, leaving gaps for refused ones', async () => {
		const first = numbersTrial();
		const refused = numbersTrial();
		refused.score = 0;
		const second = numbersTrial();

		await submit(first);
		await expect(submit(refused)).rejects.toThrow();
		await submit(second);

		const { rows } = await db.query<{ sequence_number: string }>(
			'SELECT sequence_number FROM trials WHERE trial_id = ANY($1) ORDER BY sequence_number',
			[[first.trial_id, second.trial_id]]
		);
		const [a, b] = rows.map((row) => Number(row.sequence_number));
		expect(b).toBeGreaterThan(a);
	});
});
