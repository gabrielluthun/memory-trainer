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
