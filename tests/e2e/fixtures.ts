import { test as base, expect, type Route } from '@playwright/test';

/**
 * Hanko is simulated (test strategy): the app is built with this address (playwright.config.ts),
 * and its requests are answered here. No real service is ever called, on the machine or in CI.
 */
export const HANKO_API_URL = 'https://hanko.test';
export const DATA_API_URL = 'https://data-api.test/neondb/rest/v1';
/** The token the simulated Hanko leaves in its cookie, as the real one does (SE6). */
export const SESSION_TOKEN = 'fake.session.token';

/** What the simulated Hanko says about the session; tests can change it along the way. */
export interface HankoState {
	valid: boolean;
}

/** A call received by the simulated Data API. */
export interface DataApiCall {
	fn: 'submit_trial' | 'save_settings';
	body: Record<string, unknown>;
	authorization: string | null;
}

/** The simulated Data API: what it received, and how it answers a trial (inserted by default). */
export interface DataApiState {
	calls: DataApiCall[];
	trialAnswer: { status: number; body: unknown };
}

/** Answers a cross-origin request: the browser checks CORS even on simulated responses. */
async function answer(route: Route, status: number, json?: unknown) {
	const origin = (await route.request().headerValue('origin')) ?? '*';
	await route.fulfill({
		status,
		headers: {
			'access-control-allow-origin': origin,
			'access-control-allow-credentials': 'true',
			'access-control-allow-headers': '*',
			'access-control-allow-methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
			'access-control-expose-headers': '*'
		},
		json: status === 204 ? undefined : json
	});
}

export const test = base.extend<{
	session: 'valid' | 'invalid';
	hanko: HankoState;
	dataApi: DataApiState;
}>({
	/** Signed in by default: the other tests are not about signing in (CU16). */
	session: ['valid', { option: true }],
	hanko: [
		async ({ page, session, baseURL }, use) => {
			const state: HankoState = { valid: session === 'valid' };
			if (state.valid) {
				await page
					.context()
					.addCookies([{ name: 'hanko', value: SESSION_TOKEN, url: baseURL ?? '' }]);
			}
			await page.route(`${HANKO_API_URL}/**`, async (route) => {
				const request = route.request();
				const path = new URL(request.url()).pathname;
				if (request.method() === 'OPTIONS') return answer(route, 204);
				if (path === '/sessions/validate') {
					return answer(
						route,
						200,
						state.valid
							? {
									is_valid: true,
									expiration_time: new Date(Date.now() + 12 * 3_600_000).toISOString(),
									user_id: 'practitioner'
								}
							: { is_valid: false }
					);
				}
				if (path === '/logout') {
					state.valid = false;
					return answer(route, 204);
				}
				// Sign-in flows are Hanko's own (ADR 0030): checked at acceptance, not here.
				return answer(route, 404, { code: 404, message: 'Not simulated' });
			});
			await use(state);
		},
		{ auto: true }
	],
	dataApi: [
		async ({ page }, use) => {
			const state: DataApiState = {
				calls: [],
				trialAnswer: { status: 200, body: 'inserted' }
			};
			await page.route(`${DATA_API_URL}/**`, async (route) => {
				const request = route.request();
				if (request.method() === 'OPTIONS') return answer(route, 204);
				const fn = new URL(request.url()).pathname.split('/').pop();
				if (fn !== 'submit_trial' && fn !== 'save_settings') return answer(route, 404, {});
				state.calls.push({
					fn,
					body: request.postDataJSON() as Record<string, unknown>,
					authorization: await request.headerValue('authorization')
				});
				if (fn === 'save_settings') return answer(route, 200, 'saved');
				return answer(route, state.trialAnswer.status, state.trialAnswer.body);
			});
			await use(state);
		},
		{ auto: true }
	]
});

export { expect };
export type { Page } from '@playwright/test';
