import { expect, test, type Page } from './fixtures';

// US23 (Me préparer avant la mémorisation et avant le rappel). The browser clock is faked.

test.beforeEach(async ({ page }) => {
	await page.clock.install();
});

async function openLaunch(page: Page) {
	await page.goto('/');
	await page.getByRole('link', { name: 'Lancer un essai' }).click();
}

const pause = (page: Page, which: string, seconds: number) =>
	page
		.getByRole('radiogroup', { name: which })
		.getByRole('radio', { name: `${seconds} s`, exact: true });

test('US23 CA1, CA2 — the chosen pause counts down with the digits hidden, then memorization starts', async ({
	page
}) => {
	await openLaunch(page);
	await pause(page, 'Pause avant la mémorisation', 5).click();
	await page.getByRole('button', { name: 'Commencer' }).click();

	await expect(page.getByRole('heading', { name: 'La mémorisation commence dans' })).toBeVisible();
	await expect(page.locator('.carousel')).toHaveCount(0);

	await page.clock.runFor(5_000);

	await expect(page.getByText(/^Groupe \d+ sur \d+$/)).toBeVisible();
});

test('US23 CA3 — "Commencer maintenant" and Enter cut the pauses short', async ({ page }) => {
	await openLaunch(page);
	await pause(page, 'Pause avant la mémorisation', 20).click();
	await pause(page, 'Pause avant le rappel', 20).click();
	await page.getByRole('button', { name: 'Commencer' }).click();

	await page.getByRole('button', { name: 'Commencer maintenant' }).click();
	await expect(page.getByText(/^Groupe \d+ sur \d+$/)).toBeVisible();

	await page.keyboard.press('Enter');
	await expect(page.getByRole('heading', { name: 'Le rappel commence dans' })).toBeVisible();
	await page.keyboard.press('Enter');
	await expect(page.getByRole('heading', { name: 'Votre rappel' })).toBeVisible();
});

test('US23 CA6 — abandoning during the first pause goes home and keeps nothing', async ({
	page
}) => {
	await openLaunch(page);
	await pause(page, 'Pause avant la mémorisation', 10).click();
	await page.getByRole('button', { name: 'Commencer' }).click();

	await page.getByRole('button', { name: 'Abandonner' }).click();

	await expect(page.getByRole('link', { name: 'Lancer un essai' })).toBeVisible();
	await page.clock.runFor(120_000);
	await expect(page.getByRole('link', { name: 'Lancer un essai' })).toBeVisible();
});

test('RG25 — the last pauses chosen are proposed again, and shown in the settings', async ({
	page
}) => {
	await openLaunch(page);
	await pause(page, 'Pause avant la mémorisation', 10).click();
	await pause(page, 'Pause avant le rappel', 5).click();
	await page.getByRole('button', { name: 'Commencer' }).click();
	await page.getByRole('button', { name: 'Abandonner' }).click();

	await openLaunch(page);
	await expect(pause(page, 'Pause avant la mémorisation', 10)).toHaveAttribute(
		'aria-checked',
		'true'
	);
	await expect(pause(page, 'Pause avant le rappel', 5)).toHaveAttribute('aria-checked', 'true');

	await page.goto('/settings');
	await expect(pause(page, 'Avant la mémorisation', 10)).toHaveAttribute('aria-checked', 'true');
	await expect(pause(page, 'Avant le rappel', 5)).toHaveAttribute('aria-checked', 'true');
});

test('US23 — pauses changed in the settings are proposed at launch', async ({ page }) => {
	await page.goto('/settings');
	await pause(page, 'Avant la mémorisation', 20).click();
	await expect(page.getByText('Enregistré sur cet appareil.')).toBeVisible();

	await openLaunch(page);

	await expect(pause(page, 'Pause avant la mémorisation', 20)).toHaveAttribute(
		'aria-checked',
		'true'
	);
});
