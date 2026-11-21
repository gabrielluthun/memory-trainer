import { expect, test } from '@playwright/test';

// Sprint 0 smoke test: the built app loads in every browser and emulated device.

test('the home page loads', async ({ page }) => {
	await page.goto('/');

	await expect(page).toHaveTitle('memory-trainer');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('memory-trainer');
});

test('an unknown path falls back to the app (SPA mode)', async ({ page }) => {
	await page.goto('/history');

	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
