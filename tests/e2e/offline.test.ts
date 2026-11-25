import { expect, test, type DataApiState, type Page } from './fixtures';

// US20 (M'entraîner hors connexion), ENF02, ADR 0008: the service worker keeps the app on the
// device. Allowed here only; the other tests run without it (playwright.config.ts).

test.use({ serviceWorkers: 'allow' });

// Playwright only answers requests of a page controlled by a service worker in Chromium (see
// page.route). Elsewhere the simulated services would be unreachable: WebKit, iPhone and iPad are
// checked on real devices at acceptance (TR10, airplane mode).
test.skip(
	({ browserName }) => browserName !== 'chromium',
	'Simulated services need Chromium once a service worker controls the page'
);

/** First visit online: the service worker installs, then controls the page after a reload. */
async function installed(page: Page) {
	await page.goto('/');
	await page.evaluate(async () => {
		await navigator.serviceWorker.ready;
	});
	await page.reload();
	await expect
		.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null))
		.toBe(true);
	await expect(page.getByRole('status').filter({ hasText: 'Synchronisé' })).toBeVisible();
}

const trialCalls = (dataApi: DataApiState) =>
	dataApi.calls.filter((call) => call.fn === 'submit_trial');

test('US20 CA1 — without network, the app opens and a whole trial can be played', async ({
	page,
	context
}) => {
	await installed(page);
	await context.setOffline(true);

	// Opening again, and moving between screens, all from the device.
	await page.reload();
	await expect(page.getByRole('status').filter({ hasText: 'Hors connexion' })).toBeVisible();
	await page.getByRole('link', { name: 'Lancer un essai' }).first().click();
	await page.getByRole('button', { name: 'Commencer' }).click();
	await expect(page.getByText(/^Groupe \d+ sur \d+$/)).toBeVisible();
	await page.keyboard.press('Enter');
	await expect(page.getByRole('heading', { name: 'Votre rappel' })).toBeVisible();
	await page.getByRole('button', { name: 'Finished' }).click();
	await expect(page.getByRole('heading', { name: /sur 80/ })).toBeVisible();

	await page.getByRole('link', { name: 'Historique' }).first().click();
	await expect(page.getByRole('list', { name: 'Essais' }).getByRole('link')).toHaveCount(1);
});

test('US20 CA1 — a path opened offline for the first time still gets the app', async ({
	page,
	context
}) => {
	await installed(page);
	await context.setOffline(true);

	await page.goto('/settings');

	await expect(page.getByRole('heading', { name: 'Paramètres', level: 1 })).toBeVisible();
});

test('US20 CA2 — back online, the trial is sent once, with its original date', async ({
	page,
	context,
	dataApi
}) => {
	await installed(page);
	await context.setOffline(true);
	await page.reload();
	await page.getByRole('link', { name: 'Lancer un essai' }).first().click();
	await page.getByRole('button', { name: 'Commencer' }).click();
	await expect(page.getByText(/^Groupe \d+ sur \d+$/)).toBeVisible();
	const startedBefore = Date.now();
	await page.keyboard.press('Enter');
	await page.getByRole('button', { name: 'Finished' }).click();
	await expect(page.getByRole('heading', { name: /sur 80/ })).toBeVisible();
	expect(trialCalls(dataApi)).toHaveLength(0);

	await context.setOffline(false);

	await expect.poll(() => trialCalls(dataApi).length).toBe(1);
	const sent = trialCalls(dataApi)[0].body.trial as { started_at: string };
	expect(new Date(sent.started_at).getTime()).toBeLessThanOrEqual(startedBefore);
	await page.getByRole('link', { name: 'Historique' }).first().click();
	await expect(page.getByRole('list', { name: 'Essais' }).getByRole('link')).toHaveCount(1);
});

test('SE5 — the cache holds the app only, never an answer of the Data API or of Hanko', async ({
	page
}) => {
	await installed(page);

	const cached = await page.evaluate(async () => {
		const urls: string[] = [];
		for (const name of await caches.keys()) {
			const cache = await caches.open(name);
			urls.push(...(await cache.keys()).map((request) => request.url));
		}
		return urls;
	});

	expect(cached.length).toBeGreaterThan(0);
	expect(cached.every((url) => new URL(url).origin === new URL(page.url()).origin)).toBe(true);
});
