import { expect, test, type Page } from './fixtures';

// RG11 and ADR 0027: the display pattern ("2 3"...) shapes memorization and recall.

test.beforeEach(async ({ page }) => {
	await page.clock.install();
});

async function setPattern(page: Page, first: string, second: string, third = '') {
	await page.goto('/settings');
	await page.getByLabel('Groupe 1').selectOption(first);
	await page.getByLabel('Groupe 2').selectOption(second);
	if (third) await page.getByLabel('Groupe 3').selectOption(third);
	await expect(page.getByText('Enregistré sur cet appareil.')).toBeVisible();
}

async function launch(page: Page) {
	await page.goto('/');
	await page.getByRole('link', { name: 'Lancer un essai' }).click();
	await page.getByRole('button', { name: 'Commencer' }).click();
	await expect(page.getByText(/^Groupe \d+ sur \d+$/)).toBeVisible();
}

test('RG11 — the settings preview shows the pattern "2 3" as 42 791', async ({ page }) => {
	await setPattern(page, '2', '3');

	await expect(page.getByLabel('Aperçu')).toHaveText('42 791');
});

test('RG11 — with "2 3", the frame shows 5 digits split 2 + 3, and 80 digits make 16 groups', async ({
	page
}) => {
	await setPattern(page, '2', '3');

	await launch(page);

	await expect(page.getByText('Groupe 1 sur 16')).toBeVisible();
	await expect(page.locator('.track li.current')).toHaveText(/^\d{2} \d{3}$/);
});

test('RG11 — the recall grid is spaced like the pattern', async ({ page }) => {
	await setPattern(page, '2', '3');
	await launch(page);

	await page.keyboard.press('Enter');

	// With "2 3", subgroups start at 2, 5, 7, 10, 12, 15, 17… The start of a row is not spaced:
	// a row of 20 cells (computer) shows 7 spaces, a row of 10 cells (phone) shows 3.
	await expect(page.getByRole('heading', { name: 'Votre rappel' })).toBeVisible();
	const firstRow = page.locator('.grid .row').first();
	const cells = await firstRow.locator('.cell').count();
	await expect(firstRow.locator('.cell.group-start')).toHaveCount(cells === 20 ? 7 : 3);
});

test('RG11 — removing the second subgroup also removes the third', async ({ page }) => {
	await setPattern(page, '2', '2', '2');
	await expect(page.getByLabel('Aperçu')).toHaveText('42 79 18');

	await page.getByLabel('Groupe 2').selectOption('');

	await expect(page.getByLabel('Aperçu')).toHaveText('42');
	await expect(page.getByLabel('Groupe 3')).toBeDisabled();
});
