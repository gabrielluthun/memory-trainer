import { readFileSync } from 'node:fs';
import type { BrowserContext } from '@playwright/test';
import { expect, test, type Page } from './fixtures';

// SE5 (front security), ES13: the app works under the headers Cloudflare Pages will send. The
// preview server ignores build/_headers: they are added here to every answer of the site. Their
// presence in production is checked at acceptance (ES13, recette).

/** The headers of build/_headers, written by the build (scripts/write-security-headers.ts). */
function builtHeaders(): Record<string, string> {
	const lines = readFileSync('build/_headers', 'utf8').split('\n').slice(1);
	return Object.fromEntries(
		lines
			.filter((line) => line.includes(':'))
			.map((line) => [
				line.slice(0, line.indexOf(':')).trim(),
				line.slice(line.indexOf(':') + 1).trim()
			])
	);
}

/**
 * The site as Cloudflare Pages serves it: build/index.html for any page opened (the preview server
 * renders its own page, with another start-up script), and the security headers on every answer.
 * The simulated services keep theirs.
 */
async function serveWithHeaders(context: BrowserContext, baseURL: string) {
	const headers = builtHeaders();
	const page = readFileSync('build/index.html', 'utf8');
	await context.route(
		(url) => url.origin === new URL(baseURL).origin,
		async (route) => {
			if (route.request().resourceType() === 'document') {
				return route.fulfill({ body: page, contentType: 'text/html', headers });
			}
			const response = await route.fetch();
			await route.fulfill({ response, headers: { ...response.headers(), ...headers } });
		}
	);
}

/** The CSP violations the page reports, kept until the test reads them. */
async function recordViolations(page: Page): Promise<() => Promise<string[]>> {
	await page.addInitScript(() => {
		const seen: string[] = [];
		(window as unknown as { cspViolations: string[] }).cspViolations = seen;
		document.addEventListener('securitypolicyviolation', (event) =>
			seen.push(`${event.effectiveDirective} ${event.blockedURI}`)
		);
	});
	return () =>
		page.evaluate(() => (window as unknown as { cspViolations: string[] }).cspViolations);
}

test('ES13 — a trial, the history and the settings run under the CSP, without any violation', async ({
	page,
	context,
	baseURL
}) => {
	await serveWithHeaders(context, baseURL ?? '');
	const violations = await recordViolations(page);

	await page.goto('/');
	await page.getByRole('link', { name: 'Lancer un essai' }).first().click();
	await page.getByRole('button', { name: 'Commencer' }).click();
	await expect(page.getByText(/^Groupe \d+ sur \d+$/)).toBeVisible();
	await page.keyboard.press('Enter');
	await expect(page.getByRole('heading', { name: 'Votre rappel' })).toBeVisible();
	await page.getByRole('button', { name: 'Finished' }).click();
	await expect(page.getByRole('heading', { name: /sur 80/ })).toBeVisible();
	await page.getByRole('link', { name: 'Historique' }).first().click();
	await expect(page.getByRole('list', { name: 'Essais' }).getByRole('link')).toHaveCount(1);
	await page.getByRole('link', { name: 'Paramètres' }).first().click();
	await expect(page.getByRole('heading', { name: 'Paramètres', level: 1 })).toBeVisible();

	expect(await violations()).toEqual([]);
});

test.describe('without a session', () => {
	test.use({ session: 'invalid' });

	test('ES13 — the Hanko sign-in screen runs under the CSP, without any violation', async ({
		page,
		context,
		baseURL
	}) => {
		await serveWithHeaders(context, baseURL ?? '');
		const violations = await recordViolations(page);

		await page.goto('/');
		await expect(page.getByRole('heading', { name: 'Se connecter', level: 1 })).toBeVisible();
		await expect(page.locator('hanko-auth')).toBeAttached();
		// Hanko draws its screen after asking its API: give it the time to do so.
		await page.waitForLoadState('networkidle');

		expect(await violations()).toEqual([]);
	});
});
