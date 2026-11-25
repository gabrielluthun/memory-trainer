import { expect, test, type Page } from './fixtures';

// US08 (Saisir et corriger mon rappel comme sur Memory League), for Numbers.

async function recalling(page: Page) {
	await page.goto('/');
	await page.getByRole('link', { name: 'Lancer un essai' }).click();
	await page.getByRole('button', { name: 'Commencer' }).click();
	await expect(page.getByText(/^Groupe \d+ sur \d+$/)).toBeVisible();
	await page.keyboard.press('Enter');
	await expect(page.getByRole('heading', { name: 'Votre rappel' })).toBeVisible();
}

/** The first cells of the recall grid, '' for a blank cell. */
async function firstCells(page: Page, count: number): Promise<string[]> {
	const texts = await page.locator('.cell').allTextContents();
	return texts.slice(0, count).map((text) => text.trim());
}

test('US08 — Backspace, + and − on the keyboard, before and after clicking a cell', async ({
	page
}) => {
	await recalling(page);
	await page.keyboard.type('4159');

	await page.keyboard.press('Backspace');
	await expect.poll(() => firstCells(page, 5)).toEqual(['4', '1', '5', '', '']);

	// Clicking a cell moves the input to the hidden field used by touch keyboards.
	await page.getByRole('button', { name: /^Case 2,/ }).click();
	await page.keyboard.press('+');
	await expect.poll(() => firstCells(page, 5)).toEqual(['4', '', '1', '5', '']);

	await page.keyboard.press('-');
	await expect.poll(() => firstCells(page, 5)).toEqual(['4', '1', '5', '', '']);

	await page.keyboard.press('Backspace');
	await expect.poll(() => firstCells(page, 5)).toEqual(['4', '', '5', '', '']);
});

test('US08 CA2 — the buttons under the grid insert and remove a cell', async ({ page }) => {
	await recalling(page);
	await page.keyboard.type('415');
	await page.getByRole('button', { name: /^Case 2,/ }).click();

	await page.getByRole('button', { name: 'Insérer une case' }).click();
	await expect.poll(() => firstCells(page, 4)).toEqual(['4', '', '1', '5']);

	await page.getByRole('button', { name: 'Supprimer la case' }).click();
	await expect.poll(() => firstCells(page, 4)).toEqual(['4', '1', '5', '']);
});
