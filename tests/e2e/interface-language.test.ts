import { expect, test, type Page } from '@playwright/test';

// US19 (Choisir la langue de l'interface), ADR 0029. Each test starts on an empty device.

async function chooseEnglish(page: Page) {
	await page.goto('/settings');
	await page.getByRole('radio', { name: 'English' }).click();
	await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible();
}

test('EF20 — a new device opens in French', async ({ page }) => {
	await page.goto('/settings');

	await expect(page.getByRole('heading', { name: 'Paramètres', level: 1 })).toBeVisible();
	await expect(page.getByRole('radio', { name: 'Français' })).toHaveAttribute(
		'aria-checked',
		'true'
	);
	await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
});

test('US19 CA1 — choosing English translates the interface without reloading the page', async ({
	page
}) => {
	await page.goto('/settings');
	// A mark left in the page: a reload would erase it.
	await page.evaluate(() => Object.assign(window, { stillTheSamePage: true }));

	await page.getByRole('radio', { name: 'English' }).click();

	await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible();
	await expect(page.getByRole('link', { name: 'History' }).first()).toBeVisible();
	await expect(page.getByText('Saved on this device.')).toBeVisible();
	await expect(page.getByText('Display pattern, Numbers')).toBeVisible();
	await expect(page.locator('html')).toHaveAttribute('lang', 'en');
	expect(await page.evaluate(() => 'stillTheSamePage' in window)).toBe(true);
});

test('US19 CA1 — the choice is kept when the app is opened again, and can be undone', async ({
	page
}) => {
	await chooseEnglish(page);

	await page.goto('/');

	await expect(page.getByRole('link', { name: 'Start a trial' })).toBeVisible();
	await expect(page.locator('html')).toHaveAttribute('lang', 'en');

	await page.goto('/settings');
	await page.getByRole('radio', { name: 'Français' }).click();

	await expect(page.getByRole('heading', { name: 'Paramètres', level: 1 })).toBeVisible();
	await page.goto('/');
	await expect(page.getByRole('link', { name: 'Lancer un essai' })).toBeVisible();
});

test('US19 CA2 — in English, times use a decimal point and the history says "Today"', async ({
	page
}) => {
	await chooseEnglish(page);

	await page.goto('/');
	await page.getByRole('link', { name: 'Start a trial' }).click();
	await page.getByRole('button', { name: 'Start', exact: true }).click();
	await expect(page.getByText(/^Group \d+ of \d+$/)).toBeVisible();
	await page.keyboard.press('Enter');
	await expect(page.getByRole('heading', { name: 'Your recall' })).toBeVisible();
	await page.getByRole('button', { name: 'Finished' }).click();

	await expect(page.getByRole('heading', { name: /^0\s*out of 80/ })).toBeVisible();
	await expect(page.locator('.times dd').first()).toHaveText(/^\d+\.\d\d s$/);

	await page.getByRole('link', { name: 'History' }).first().click();
	await expect(page.getByRole('list', { name: 'Trials' }).getByRole('link')).toContainText('Today');
});
