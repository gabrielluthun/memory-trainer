import { expect, test } from './fixtures';

// CU18 (Installer l'application), mock-up 12: on iPhone and iPad, Safari may erase the data of an
// app that is not installed (technical constraints). The installation itself is checked on the
// real devices at acceptance (TR11).

test.describe('opened in Safari, not installed', () => {
	test.use({ installed: false });

	test('CU18 — on iPhone and iPad, the reminder shows at every opening; "Plus tard" closes it', async ({
		page
	}, testInfo) => {
		test.skip(
			!['iphone', 'ipad'].includes(testInfo.project.name),
			'Only iPhone and iPad need the reminder'
		);
		const reminder = page.getByRole('dialog', { name: 'Installez memory-trainer' });

		await page.goto('/');
		await expect(reminder).toBeVisible();
		await expect(reminder.getByText("Sur l'écran d'accueil")).toBeVisible();
		await reminder.getByRole('button', { name: 'Plus tard' }).click();
		await expect(reminder).toBeHidden();

		// Moving around the app: still the same opening.
		await page.getByRole('link', { name: 'Historique' }).first().click();
		await expect(page).toHaveURL(/\/history$/);
		await expect(reminder).toBeHidden();

		await page.reload();
		await expect(reminder).toBeVisible();
	});

	test('CU18 — on a computer or Android, no reminder: the browser offers the installation', async ({
		page
	}, testInfo) => {
		test.skip(['iphone', 'ipad'].includes(testInfo.project.name), 'iPhone and iPad remind');

		await page.goto('/');

		await expect(page.getByRole('heading', { name: 'Numbers' })).toBeVisible();
		await expect(page.getByRole('dialog', { name: 'Installez memory-trainer' })).toHaveCount(0);
	});
});

test('CU18 — installed: no reminder, on any device', async ({ page }) => {
	await page.goto('/');

	await expect(page.getByRole('heading', { name: 'Numbers' })).toBeVisible();
	await expect(page.getByRole('dialog', { name: 'Installez memory-trainer' })).toHaveCount(0);
});
