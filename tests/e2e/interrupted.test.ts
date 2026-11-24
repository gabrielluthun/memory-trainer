import { expect, test, type Page } from '@playwright/test';

// US10 (Abandonner un essai), interrupted trial (CU06, TR06): the app is closed during a trial,
// then reopened. Each test starts on an empty device.

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
	// The ongoing trial is saved every 2 s (SEQ02).
	await page.waitForTimeout(2_500);
}

/** Closes the app and opens it again: nothing is left in memory, only on the device. */
async function reopen(page: Page) {
	await page.goto('about:blank');
	await page.goto('/');
}

const choices = (page: Page) => page.getByRole('dialog', { name: /^Que faire de l'essai/ });

test('US10 CA5, CA6 — at reopening, the three choices for the interrupted trial, with no way out', async ({
	page
}) => {
	await recalling(page);

	await reopen(page);

	await expect(choices(page)).toBeVisible();
	await expect(choices(page).getByText('Essai interrompu')).toBeVisible();
	await expect(choices(page)).toContainText("Il s'est arrêté pendant le rappel");
	await expect(choices(page).getByRole('button')).toHaveCount(3);
	// No "Annuler": Escape does not close the window (CU05, CU06).
	await page.keyboard.press('Escape');
	await expect(choices(page)).toBeVisible();
});

test('RG24 — "Garder hors statistiques" keeps it as "Erreur externe", asked only once', async ({
	page
}) => {
	await recalling(page);
	await reopen(page);

	await choices(page)
		.getByRole('button', { name: /^Garder hors statistiques/ })
		.click();
	await expect(choices(page)).toBeHidden();

	await page.goto('/history');
	const trials = page.getByRole('list', { name: 'Essais' }).getByRole('link');
	await expect(trials).toHaveCount(1);
	await expect(trials.first()).toContainText('Erreur externe');

	await reopen(page);
	await expect(page.getByRole('link', { name: 'Lancer un essai' })).toBeVisible();
	await expect(choices(page)).toHaveCount(0);
});

test('US10 CA6 — "Compter tel quel" scores the answers saved before the interruption', async ({
	page
}) => {
	await recalling(page);
	await reopen(page);

	await choices(page)
		.getByRole('button', { name: /^Compter tel quel/ })
		.click();

	await expect(page).toHaveURL(/\/history\/[^/]+$/);
	await expect(page.getByRole('heading', { name: /sur 80/ })).toBeVisible();
});

test('US10 CA6 — "Ne pas garder" keeps nothing', async ({ page }) => {
	await recalling(page);
	await reopen(page);

	await choices(page)
		.getByRole('button', { name: /^Ne pas garder/ })
		.click();
	await expect(choices(page)).toBeHidden();

	await page.goto('/history');
	await expect(page.getByText('Aucun essai pour le moment.')).toBeVisible();
	await reopen(page);
	await expect(choices(page)).toHaveCount(0);
});

test('RG24 — an interruption during memorization is offered too', async ({ page }) => {
	await launch(page);

	await reopen(page);

	await expect(choices(page)).toContainText("Il s'est arrêté pendant la mémorisation");
});

test('ENF07 — a finished trial is never offered as interrupted', async ({ page }) => {
	await launch(page);
	await page.keyboard.press('Enter');
	await expect(page.getByRole('heading', { name: 'Votre rappel' })).toBeVisible();
	await page.getByRole('button', { name: 'Finished' }).click();
	await expect(page.getByRole('heading', { name: /sur 80/ })).toBeVisible();

	await reopen(page);

	await expect(page.getByRole('link', { name: 'Lancer un essai' })).toBeVisible();
	await expect(choices(page)).toHaveCount(0);
});
