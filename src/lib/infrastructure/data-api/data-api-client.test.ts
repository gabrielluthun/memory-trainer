import { describe, expect, it } from 'vitest';
import { FakeAuthSession } from '../../../../tests/fakes/fake-auth-session';
import { SessionRejected, TrialRejected } from '../../application/ports';
import { NumbersDiscipline } from '../../domain/disciplines/numbers';
import { Settings } from '../../domain/settings/settings';
import { DataApiClient } from './data-api-client';

const URL_BASE = 'https://data-api.test/neondb/rest/v1';
const trial = { id: 'trial-a', record: { trial_id: 'trial-a', status: 'completed' } };

/** A fetch answering like the Data API (PostgREST), and keeping each request. */
function simulatedApi(answer: (request: Request) => Response | Promise<Response>) {
	const requests: Request[] = [];
	const fetchFn = async (input: RequestInfo | URL, init?: RequestInit) => {
		const request = new Request(input, init);
		requests.push(request.clone());
		return answer(request);
	};
	return { requests, fetchFn };
}

const json = (status: number, body: unknown) =>
	new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

function client(fetchFn: typeof fetch, session: 'valid' | 'invalid' = 'valid') {
	return new DataApiClient(
		URL_BASE,
		new FakeAuthSession(session),
		[new NumbersDiscipline()],
		fetchFn
	);
}

describe('DataApiClient — sending a trial (ADR 0010, ADR 0031)', () => {
	it('SEQ05 — calls submit_trial with the stored record and the session token', async () => {
		const api = simulatedApi(() => json(200, 'inserted'));

		const result = await client(api.fetchFn).sendTrial(trial);

		expect(result).toBe('inserted');
		const [request] = api.requests;
		expect(request.method).toBe('POST');
		expect(request.url).toBe(`${URL_BASE}/rpc/submit_trial`);
		expect(request.headers.get('authorization')).toBe('Bearer fake.jwt.token');
		expect(await request.json()).toEqual({ trial: trial.record });
	});

	it('ES15 — sends no information about the app or the device', async () => {
		const api = simulatedApi(() => json(200, 'inserted'));

		await client(api.fetchFn).sendTrial(trial);

		expect(api.requests[0].headers.get('x-neon-client-info')).toBeNull();
	});

	it('RG22 — a trial already received comes back as "duplicate"', async () => {
		const api = simulatedApi(() => json(200, 'duplicate'));

		expect(await client(api.fetchFn).sendTrial(trial)).toBe('duplicate');
	});

	it('ES07 — a value refused by the database marks the trial as refused', async () => {
		const api = simulatedApi(() =>
			json(400, { code: '23514', message: 'new row violates check constraint' })
		);

		await expect(client(api.fetchFn).sendTrial(trial)).rejects.toBeInstanceOf(TrialRejected);
	});

	it('SEQ05 — an expired token asks to sign in again', async () => {
		const api = simulatedApi(() => json(401, { code: 'PGRST303', message: 'JWT expired' }));

		await expect(client(api.fetchFn).sendTrial(trial)).rejects.toBeInstanceOf(SessionRejected);
	});

	it('ES04 — an account the database does not accept asks to sign in again, never refuses trials', async () => {
		const api = simulatedApi(() =>
			json(403, { code: '42501', message: 'new row violates row-level security policy' })
		);

		await expect(client(api.fetchFn).sendTrial(trial)).rejects.toBeInstanceOf(SessionRejected);
	});

	it('CU17 1a — network lost or server unavailable: an ordinary error, the trial stays queued', async () => {
		const offline = simulatedApi(() => Promise.reject(new TypeError('Failed to fetch')));
		const unavailable = simulatedApi(() => json(503, { message: 'Service unavailable' }));

		for (const fetchFn of [offline.fetchFn, unavailable.fetchFn]) {
			const error = await client(fetchFn)
				.sendTrial(trial)
				.catch((caught: unknown) => caught);
			expect(error).toBeInstanceOf(Error);
			expect(error).not.toBeInstanceOf(TrialRejected);
			expect(error).not.toBeInstanceOf(SessionRejected);
		}
	});

	it('CU16 — without a session, nothing is sent', async () => {
		const api = simulatedApi(() => json(200, 'inserted'));

		await expect(client(api.fetchFn, 'invalid').sendTrial(trial)).rejects.toBeInstanceOf(
			SessionRejected
		);
		expect(api.requests).toEqual([]);
	});
});

describe('DataApiClient — sending the settings (ADR 0012)', () => {
	it('SEQ05 — calls save_settings with the settings and the time of their change', async () => {
		const api = simulatedApi(() => json(200, 'saved'));
		const settings = Settings.defaults().withLanguage('en', new Date('2026-11-24T09:00:00Z'));

		const result = await client(api.fetchFn).sendSettings(settings);

		expect(result).toBe('saved');
		expect(api.requests[0].url).toBe(`${URL_BASE}/rpc/save_settings`);
		expect(await api.requests[0].json()).toMatchObject({
			settings: { interface_language: 'en', settings_modified_at: '2026-11-24T09:00:00.000Z' }
		});
	});

	it('ADR 0012 — older settings than the database ones come back as "ignored"', async () => {
		const api = simulatedApi(() => json(200, 'ignored'));

		expect(await client(api.fetchFn).sendSettings(Settings.defaults())).toBe('ignored');
	});
});

describe('DataApiClient — receiving (SEQ05, ADR 0011)', () => {
	const row = {
		trial_id: 'remote-a',
		sequence_number: 8,
		discipline: 'numbers',
		mode: 'standard',
		status: 'completed',
		started_at: '2026-11-21T10:00:00+00:00',
		item_count: 1,
		memorization_limit_ms: 60_000,
		recall_limit_ms: 240_000,
		memorization_ms: 1_000,
		recall_ms: 2_000,
		score: 1,
		trial_items: [
			{
				position: 1,
				is_correct: true,
				trial_items_numbers: { expected_digit: 3, answered_digit: 3 }
			}
		]
	};

	it('ADR 0011 — asks for the trials after the cursor, in order, by pages, with their items', async () => {
		const api = simulatedApi(() => json(200, [row]));

		const received = await client(api.fetchFn).fetchTrials(7, 50);

		const url = new URL(api.requests[0].url);
		expect(url.pathname).toBe('/neondb/rest/v1/trials');
		expect(url.searchParams.get('sequence_number')).toBe('gt.7');
		expect(url.searchParams.get('order')).toBe('sequence_number.asc');
		expect(url.searchParams.get('limit')).toBe('50');
		expect(url.searchParams.get('select')).toContain('trial_items(');
		expect(api.requests[0].headers.get('authorization')).toBe('Bearer fake.jwt.token');
		expect(received).toHaveLength(1);
		expect(received[0]).toMatchObject({ id: 'remote-a', sequenceNumber: 8 });
		expect(received[0].record).toMatchObject({
			trial_id: 'remote-a',
			started_at: '2026-11-21T10:00:00.000Z'
		});
	});

	it('SEQ05 — an expired token while receiving asks to sign in again', async () => {
		const api = simulatedApi(() => json(401, { code: 'PGRST303', message: 'JWT expired' }));

		await expect(client(api.fetchFn).fetchTrials(0, 50)).rejects.toBeInstanceOf(SessionRejected);
	});

	it('ADR 0012 — reads the settings of the account with those of each discipline', async () => {
		const api = simulatedApi(() =>
			json(200, [
				{
					interface_language: 'en',
					settings_modified_at: '2026-11-24T08:00:00+00:00',
					discipline_settings: []
				}
			])
		);

		const settings = await client(api.fetchFn).fetchSettings();

		expect(new URL(api.requests[0].url).pathname).toBe('/neondb/rest/v1/accounts');
		expect(settings?.interfaceLanguage).toBe('en');
	});

	it('ES04 — no account row readable: no settings to take', async () => {
		const api = simulatedApi(() => json(200, []));

		expect(await client(api.fetchFn).fetchSettings()).toBeNull();
	});
});
