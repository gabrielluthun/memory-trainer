import { expect, test, type Page } from '@playwright/test';

// US12 (Consulter mon historique), CU07. Each test starts on an empty device.

/** A standard Numbers trial where only the first `right` digits are recalled. */
async function playTrial(page: Page, right: number) {
	await page.goto('/');
	await page.getByRole('link', { name: 'Lancer un essai' }).click();
	await page.getByRole('button', { name: 'Commencer' }).click();
	await expect(page.getByText(/^Groupe \d+ sur \d+$/)).toBeVisible();
	const digits = (await page.locator('.track li').allTextContents()).join('');
	await page.keyboard.press('Enter');
	await expect(page.getByRole('heading', { name: 'Votre rappel' })).toBeVisible();
	await page.keyboard.type(digits.slice(0, right));
	await page.getByRole('button', { name: 'Finished' }).click();
	await expect(
		page.getByRole('heading', { name: new RegExp(`^${right}\\s*sur 80`) })
	).toBeVisible();
}

const trials = (page: Page) => page.getByRole('list', { name: 'Essais' }).getByRole('link');

test('US12 CA1, CA2 — lists the trials most recent first, and opens one on its corrected copy', async ({
	page
}) => {
	await playTrial(page, 0);
	await playTrial(page, 3);

	await page.getByRole('link', { name: 'Historique' }).first().click();

	await expect(page.getByRole('heading', { name: 'Historique', level: 1 })).toBeVisible();
	await expect(trials(page)).toHaveCount(2);
	await expect(trials(page).nth(0)).toContainText('3 / 80');
	await expect(trials(page).nth(1)).toContainText('0 / 80');
	await expect(trials(page).nth(0)).toContainText('Compté');

	await trials(page).nth(0).click();

	await expect(page.getByRole('heading', { name: /^3\s*sur 80/ })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Copie corrigée' })).toBeVisible();
});

test('US12 CA1 — filters by mode', async ({ page }) => {
	await playTrial(page, 2);
	await page.goto('/history');
	await expect(trials(page)).toHaveCount(1);

	await page.getByLabel('Mode').selectOption({ label: 'Personnalisé' });
	await expect(trials(page)).toHaveCount(0);
	await expect(page.getByText('Aucun essai pour ces filtres.')).toBeVisible();

	await page.getByLabel('Mode').selectOption({ label: 'Tous les modes' });
	await expect(trials(page)).toHaveCount(1);
});

test('CU07 1a — an empty history invites to launch a first trial', async ({ page }) => {
	await page.goto('/history');

	await expect(page.getByText('Aucun essai pour le moment.')).toBeVisible();
	await page.getByRole('main').getByRole('link', { name: 'Lancer un essai' }).click();
	await expect(page.getByRole('button', { name: 'Commencer' })).toBeVisible();
});
