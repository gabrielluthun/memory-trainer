import { test as base, expect, type Route } from '@playwright/test';

/**
 * Hanko is simulated (test strategy): the app is built with this address (playwright.config.ts),
 * and its requests are answered here. No real service is ever called, on the machine or in CI.
 */
export const HANKO_API_URL = 'https://hanko.test';

/** What the simulated Hanko says about the session; tests can change it along the way. */
export interface HankoState {
	valid: boolean;
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

export const test = base.extend<{ session: 'valid' | 'invalid'; hanko: HankoState }>({
	/** Signed in by default: the other tests are not about signing in (CU16). */
	session: ['valid', { option: true }],
	hanko: [
		async ({ page, session }, use) => {
			const state: HankoState = { valid: session === 'valid' };
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
	]
});

export { expect };
export type { Page } from '@playwright/test';
