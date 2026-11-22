import { expect, test, type Page } from '@playwright/test';

// US01 (S'entraîner à Numbers) and US07 (Naviguer et terminer la mémorisation plus tôt).
// The browser clock is faked, so the 1 minute and 4 minute limits are checked for real.

test.beforeEach(async ({ page }) => {
	await page.clock.install();
});

async function launch(page: Page) {
	await page.goto('/');
	await page.getByRole('link', { name: 'Lancer un essai' }).click();
	await page.getByRole('button', { name: 'Commencer' }).click();
	await expect(page.getByText(/^Groupe \d+ sur \d+$/)).toBeVisible();
}

/** The 80 digits drawn, read from the memorization strip. */
async function drawnDigits(page: Page): Promise<string> {
	return (await page.locator('.track li').allTextContents()).join('');
}

test('US01 — a standard trial: 80 digits, stops at 1 minute, scored on the digits at the right place', async ({
	page
}) => {
	await launch(page);
	await expect(page.getByText('Groupe 1 sur 40')).toBeVisible();
	const digits = await drawnDigits(page);
	expect(digits).toMatch(/^[0-9]{80}$/);

	await page.clock.runFor(60_000);
	await expect(page.getByRole('heading', { name: 'Votre rappel' })).toBeVisible();

	// Ten right digits, then one wrong.
	await page.keyboard.type(digits.slice(0, 10));
	await page.keyboard.type(String((Number(digits[10]) + 1) % 10));
	await page.getByRole('button', { name: 'Finished' }).click();

	await expect(page.getByRole('heading', { name: /10\s*sur 80/ })).toBeVisible();
	await expect(page.getByText('1:00,00')).toBeVisible();
});

test('US01 — the recall stops by itself after 4 minutes', async ({ page }) => {
	await launch(page);
	await page.keyboard.press('Enter');
	await expect(page.getByRole('heading', { name: 'Votre rappel' })).toBeVisible();

	await page.clock.runFor(240_000);

	await expect(page.getByRole('heading', { name: /0\s*sur 80/ })).toBeVisible();
	await expect(page.getByText('4:00,00')).toBeVisible();
});

test('US07 — arrows move through the groups, Space goes back to the start, Enter finishes', async ({
	page
}) => {
	await launch(page);

	await page.keyboard.press('ArrowRight');
	await page.keyboard.press('ArrowRight');
	await page.keyboard.press('ArrowLeft');
	await expect(page.getByText('Groupe 2 sur 40')).toBeVisible();

	await page.keyboard.press('Space');
	await expect(page.getByText('Groupe 1 sur 40')).toBeVisible();

	await page.clock.runFor(12_340);
	await page.keyboard.press('Enter');
	await expect(page.getByRole('heading', { name: 'Votre rappel' })).toBeVisible();
	await page.getByRole('button', { name: 'Finished' }).click();
	// Exact to the millisecond in the unit tests; here the fake clock also flows in real time.
	await expect(page.getByText(/^12,\d\d s$/)).toBeVisible();
});

test('US07 — → twice quickly on the last group finishes the memorization', async ({ page }) => {
	await launch(page);
	for (let i = 0; i < 39; i++) await page.keyboard.press('ArrowRight');
	await expect(page.getByText('Groupe 40 sur 40')).toBeVisible();

	await page.keyboard.press('ArrowRight');
	await page.keyboard.press('ArrowRight');

	await expect(page.getByRole('heading', { name: 'Votre rappel' })).toBeVisible();
});

test('US07 CA1bis — the display pattern chosen in the settings applies to the next trial', async ({
	page
}) => {
	await page.goto('/settings');
	await page.getByLabel('Groupe 1').selectOption('4');
	await expect(page.getByText('Enregistré sur cet appareil.')).toBeVisible();

	await launch(page);

	await expect(page.getByText('Groupe 1 sur 20')).toBeVisible();
});
