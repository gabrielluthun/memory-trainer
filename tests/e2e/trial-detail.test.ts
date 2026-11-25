import { expect, test } from './fixtures';

// US11 (Voir le détail d'un essai): the corrected copy of mock-up 07, for Numbers.

test('US11 CA1 — the result shows each expected digit next to the answer, errors in red', async ({
	page
}) => {
	await page.goto('/');
	await page.getByRole('link', { name: 'Lancer un essai' }).click();
	await page.getByRole('button', { name: 'Commencer' }).click();
	await expect(page.getByText(/^Groupe \d+ sur \d+$/)).toBeVisible();
	const digits = (await page.locator('.track li').allTextContents()).join('');
	await page.keyboard.press('Enter');
	await expect(page.getByRole('heading', { name: 'Votre rappel' })).toBeVisible();

	// Ten right digits, one wrong, the rest left blank.
	const wrong = String((Number(digits[10]) + 1) % 10);
	await page.keyboard.type(digits.slice(0, 10) + wrong);
	await page.getByRole('button', { name: 'Finished' }).click();

	await expect(page.getByRole('heading', { name: /10\s*sur 80/ })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Copie corrigée' })).toBeVisible();
	await expect(page.getByLabel(`Case 1 : ${digits[0]}, juste`)).toBeVisible();
	await expect(page.getByLabel(`Case 11 : ${wrong} au lieu de ${digits[10]}`)).toBeVisible();
	await expect(page.getByLabel(`Case 12 : vide, attendu ${digits[11]}`)).toBeVisible();
	// 20 cells per row on a computer, 10 on a phone.
	await expect(page.getByLabel(/^Ligne 1 : 10 sur (20|10)$/)).toBeVisible();
});
