import { expect, SESSION_TOKEN, test, type DataApiState, type Page } from './fixtures';

// CU17 (Synchroniser ses données), sending part: SEQ05, RG22, ES07. The Data API is simulated
// (fixtures.ts); the real one is checked at acceptance (TR10).

/**
 * A standard Numbers trial, finished without recalling anything. `reopen: false` stays in the
 * open app: reopening it would bring the sign-in screen back (CU16).
 */
async function playTrial(page: Page, { reopen = true } = {}) {
	if (reopen) await page.goto('/');
	await page.getByRole('link', { name: 'Lancer un essai' }).click();
	await page.getByRole('button', { name: 'Commencer' }).click();
	await expect(page.getByText(/^Groupe \d+ sur \d+$/)).toBeVisible();
	await page.keyboard.press('Enter');
	await expect(page.getByRole('heading', { name: 'Votre rappel' })).toBeVisible();
	await page.getByRole('button', { name: 'Finished' }).click();
	await expect(page.getByRole('heading', { name: /sur 80/ })).toBeVisible();
}

const trialCalls = (dataApi: DataApiState) =>
	dataApi.calls.filter((call) => call.fn === 'submit_trial');

test('CU17 — at the next opening, a finished trial is sent once, with the session token', async ({
	page,
	dataApi
}) => {
	await playTrial(page);

	await page.goto('/');
	await expect.poll(() => trialCalls(dataApi).length).toBe(1);

	const [call] = trialCalls(dataApi);
	expect(call.authorization).toBe(`Bearer ${SESSION_TOKEN}`);
	expect(call.body.trial).toMatchObject({ discipline: 'numbers', status: 'completed', score: 0 });

	// Received: out of the queue, never sent again (RG22).
	await page.goto('/history');
	await page.reload();
	await expect(page.getByRole('heading', { name: 'Historique', level: 1 })).toBeVisible();
	await expect.poll(() => trialCalls(dataApi).length).toBe(1);
});

test('ES07 — a trial refused by the database is shown as refused, and not sent again', async ({
	page,
	dataApi
}) => {
	dataApi.trialAnswer = { status: 400, body: { code: '23514', message: 'check violation' } };
	await playTrial(page);
	await page.goto('/history');
	await expect.poll(() => trialCalls(dataApi).length).toBe(1);

	await page.reload();

	await expect(
		page.getByRole('list', { name: 'Essais' }).getByText('Refusé par la base')
	).toBeVisible();
	await page.reload();
	await expect(page.getByRole('heading', { name: 'Historique', level: 1 })).toBeVisible();
	await expect.poll(() => trialCalls(dataApi).length).toBe(1);
});

test.describe('without a session', () => {
	test.use({ session: 'invalid' });

	test('CU16, CU17 — nothing is sent offline from the session; signing in sends the waiting trials', async ({
		page,
		hanko,
		dataApi,
		baseURL
	}) => {
		await page.goto('/');
		await page.getByRole('button', { name: 'Continuer hors connexion' }).click();
		await playTrial(page, { reopen: false });
		expect(trialCalls(dataApi)).toHaveLength(0);

		// What Hanko does once the passkey is accepted: a cookie, then its event.
		hanko.valid = true;
		await page.context().addCookies([{ name: 'hanko', value: SESSION_TOKEN, url: baseURL ?? '' }]);
		await page.evaluate(() => {
			const expiration = Math.floor(Date.now() / 1000) + 12 * 3600;
			document.dispatchEvent(
				new CustomEvent('hanko-session-created', {
					detail: { claims: { subject: 'practitioner', expiration }, expirationSeconds: 43200 }
				})
			);
		});

		await expect.poll(() => trialCalls(dataApi).length).toBe(1);
	});
});

test('ADR 0012 — settings changed on this device are sent with the time of the change', async ({
	page,
	dataApi
}) => {
	await page.goto('/settings');
	await page.getByRole('radio', { name: 'English' }).click();
	await expect(page.getByText('Saved on this device.')).toBeVisible();

	await page.goto('/');

	await expect
		.poll(() => dataApi.calls.filter((call) => call.fn === 'save_settings').length)
		.toBe(1);
	const settings = dataApi.calls.find((call) => call.fn === 'save_settings')?.body.settings;
	expect(settings).toMatchObject({
		interface_language: 'en',
		disciplines: [{ discipline: 'numbers', group_pattern: [2] }]
	});
});
