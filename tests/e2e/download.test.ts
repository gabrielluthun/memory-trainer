import { expect, test, type DataApiState, type Page } from './fixtures';

// CU17 (Synchroniser ses données), receiving part and triggers: SEQ05, ADR 0011, ADR 0012,
// mock-up 10. The Data API is simulated (fixtures.ts); the real one is checked at acceptance (TR10).

/** A trial made on another device, as the Data API returns it: 3 digits, 2 right. */
const otherDeviceTrial = (sequenceNumber: number) => ({
	trial_id: `00000000-0000-4000-8000-00000000000${sequenceNumber}`,
	sequence_number: sequenceNumber,
	discipline: 'numbers',
	mode: 'custom',
	status: 'completed',
	started_at: '2026-11-20T18:30:00+00:00',
	item_count: 3,
	memorization_limit_ms: 30_000,
	recall_limit_ms: 240_000,
	memorization_ms: 21_000,
	recall_ms: 60_000,
	score: 2,
	trial_items: [
		{
			position: 1,
			is_correct: true,
			trial_items_numbers: { expected_digit: 4, answered_digit: 4 }
		},
		{
			position: 2,
			is_correct: true,
			trial_items_numbers: { expected_digit: 1, answered_digit: 1 }
		},
		{
			position: 3,
			is_correct: false,
			trial_items_numbers: { expected_digit: 7, answered_digit: 2 }
		}
	]
});

const trialCalls = (dataApi: DataApiState) =>
	dataApi.calls.filter((call) => call.fn === 'submit_trial');

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

test('US21 CA1 — a trial made on another device appears in the history, with its corrected copy', async ({
	page,
	dataApi
}) => {
	dataApi.remoteTrials = [otherDeviceTrial(1)];

	await page.goto('/history');

	const trials = page.getByRole('list', { name: 'Essais' }).getByRole('link');
	await expect(trials).toHaveCount(1);
	await expect(trials.first()).toContainText('2 / 3');
	await trials.first().click();
	await expect(page.getByRole('heading', { name: /^2\s*sur 3/ })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Copie corrigée' })).toBeVisible();
});

test('ADR 0011 — at the next opening, only the trials after the cursor are asked for', async ({
	page,
	dataApi
}) => {
	const askedAfter = () =>
		dataApi.calls.filter((call) => call.fn === 'trials').map((call) => call.body.after);
	dataApi.remoteTrials = [otherDeviceTrial(1)];
	await page.goto('/');
	await expect(page.getByRole('status').filter({ hasText: 'Synchronisé' })).toBeVisible();

	await page.reload();

	await expect.poll(askedAfter).toEqual([0, 1]);
	await page.goto('/history');
	await expect(page.getByRole('list', { name: 'Essais' }).getByRole('link')).toHaveCount(1);
});

test('ADR 0012 — more recent settings from another device are taken, language included', async ({
	page,
	dataApi
}) => {
	dataApi.account = {
		interface_language: 'en',
		settings_modified_at: '2099-01-01T00:00:00+00:00',
		discipline_settings: []
	};

	await page.goto('/');

	await expect(page.getByRole('link', { name: 'Start a trial' })).toBeVisible();
	await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('CU17 — the end of a trial sends it, without reopening the app', async ({ page, dataApi }) => {
	await page.goto('/');

	await playTrial(page);

	await expect.poll(() => trialCalls(dataApi).length).toBe(1);
});

test('CU17 — a trial made offline is sent when the network comes back', async ({
	page,
	context,
	dataApi
}) => {
	await page.goto('/');
	await expect(page.getByRole('status').filter({ hasText: 'Synchronisé' })).toBeVisible();

	// The network is cut during the recall: loading other screens offline comes with US20.
	await page.getByRole('link', { name: 'Lancer un essai' }).first().click();
	await page.getByRole('button', { name: 'Commencer' }).click();
	await expect(page.getByText(/^Groupe \d+ sur \d+$/)).toBeVisible();
	await page.keyboard.press('Enter');
	await expect(page.getByRole('heading', { name: 'Votre rappel' })).toBeVisible();
	await context.setOffline(true);
	await page.getByRole('button', { name: 'Finished' }).click();
	await expect(page.getByRole('status').filter({ hasText: 'Hors connexion' })).toBeVisible();
	expect(trialCalls(dataApi)).toHaveLength(0);

	await context.setOffline(false);

	await expect.poll(() => trialCalls(dataApi).length).toBe(1);
	await expect(page.getByRole('status').filter({ hasText: 'Synchronisé' })).toBeVisible();
});

test('mock-up 10 — the header and the settings tell when the last synchronisation happened', async ({
	page,
	dataApi
}) => {
	await page.goto('/settings');

	await expect(
		page.getByRole('status').filter({ hasText: 'Synchronisé à l’instant' })
	).toBeVisible();
	await expect(page.getByText(/^Dernière : aujourd'hui à \d\d:\d\d$/)).toBeVisible();

	const before = dataApi.calls.filter((call) => call.fn === 'trials').length;
	await page.getByRole('button', { name: 'Synchroniser' }).click();
	await expect
		.poll(() => dataApi.calls.filter((call) => call.fn === 'trials').length)
		.toBe(before + 1);
});
