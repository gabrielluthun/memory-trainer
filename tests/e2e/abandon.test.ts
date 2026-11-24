import { expect, test, type Page } from './fixtures';

// US10 (Abandonner un essai), voluntary abandon (CU05). Each test starts on an empty device.

async function launch(page: Page) {
	await page.goto('/');
	await page.getByRole('link', { name: 'Lancer un essai' }).click();
	await page.getByRole('button', { name: 'Commencer' }).click();
	await expect(page.getByText(/^Groupe \d+ sur \d+$/)).toBeVisible();
}

async function recalling(page: Page) {
	await launch(page);
	await page.keyboard.press('Enter');
	await expect(page.getByRole('heading', { name: 'Votre rappel' })).toBeVisible();
	await page.keyboard.type('1234');
}

const choices = (page: Page) => page.getByRole('dialog', { name: "Abandonner l'essai ?" });

test('US10 CA1, CA2 — three choices without a way back; "Garder hors statistiques" keeps it as abandoned', async ({
	page
}) => {
	await recalling(page);

	await page.getByRole('button', { name: 'Abandonner' }).click();
	await expect(choices(page)).toBeVisible();
	await expect(choices(page).getByRole('button')).toHaveCount(3);
	// No "Annuler": Escape does not close the window (CU05).
	await page.keyboard.press('Escape');
	await expect(choices(page)).toBeVisible();

	await choices(page)
		.getByRole('button', { name: /^Garder hors statistiques/ })
		.click();

	await expect(page.getByRole('link', { name: 'Lancer un essai' })).toBeVisible();
	await page.goto('/history');
	const trials = page.getByRole('list', { name: 'Essais' }).getByRole('link');
	await expect(trials).toHaveCount(1);
	await expect(trials.first()).toContainText('Abandonné');
});

test('US10 CA3 — "Compter tel quel" scores the answers already given', async ({ page }) => {
	await launch(page);

	await page.getByRole('button', { name: 'Abandonner' }).click();
	await choices(page)
		.getByRole('button', { name: /^Compter tel quel/ })
		.click();

	await expect(page.getByRole('heading', { name: /^0\s*sur 80/ })).toBeVisible();
});

test('US10 CA4 — "Ne pas garder" keeps nothing', async ({ page }) => {
	await recalling(page);

	await page.getByRole('button', { name: 'Abandonner' }).click();
	await choices(page)
		.getByRole('button', { name: /^Ne pas garder/ })
		.click();

	await expect(page.getByRole('link', { name: 'Lancer un essai' })).toBeVisible();
	await page.goto('/history');
	await expect(page.getByText('Aucun essai pour le moment.')).toBeVisible();
});
