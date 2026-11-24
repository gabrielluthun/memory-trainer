import type { BrowserContext } from '@playwright/test';
import { expect, test, type Page } from './fixtures';

// US20, update part (deployment, section 5; ADR 0023): before each synchronisation, the app reads
// version.json, simulated here. The card and the installation of a new version need a real
// service worker: they are checked at acceptance (TR14, from 0.2).

/** What the published site says about its version; `null` for a missing file. */
async function publish(context: BrowserContext, version: string | null) {
	await context.route(
		(url) => url.pathname === '/version.json',
		(route) =>
			version === null
				? route.fulfill({ status: 404, body: 'Not found' })
				: route.fulfill({ json: { version } })
	);
}

/** A standard Numbers trial in the open app, finished without recalling anything. */
async function playTrial(page: Page) {
	await page.getByRole('link', { name: 'Lancer un essai' }).first().click();
	await page.getByRole('button', { name: 'Commencer' }).click();
	await expect(page.getByText(/^Groupe \d+ sur \d+$/)).toBeVisible();
	await page.keyboard.press('Enter');
	await expect(page.getByRole('heading', { name: 'Votre rappel' })).toBeVisible();
	await page.getByRole('button', { name: 'Finished' }).click();
	await expect(page.getByRole('heading', { name: /sur 80/ })).toBeVisible();
}

test('ADR 0023 — another version is published: the trial stays on the device until the update', async ({
	page,
	context,
	dataApi
}) => {
	await publish(context, '99.0.0');

	await page.goto('/');
	await playTrial(page);

	await expect(
		page.getByRole('status').filter({ hasText: 'Mise à jour en attente' })
	).toBeVisible();
	expect(dataApi.calls).toEqual([]);
	await page.goto('/history');
	await expect(page.getByRole('list', { name: 'Essais' }).getByRole('link')).toHaveCount(1);
});

test('ADR 0023 — version.json cannot be read: nothing is sent, the sync waits', async ({
	page,
	context,
	dataApi
}) => {
	await publish(context, null);

	await page.goto('/');
	await playTrial(page);

	await expect(
		page.getByRole('status').filter({ hasText: 'Synchronisation en attente' })
	).toBeVisible();
	expect(dataApi.calls).toEqual([]);
});
