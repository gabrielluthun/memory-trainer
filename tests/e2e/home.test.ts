import { expect, test } from './fixtures';

test('the home page offers to launch a Numbers trial', async ({ page }) => {
	await page.goto('/');

	await expect(page).toHaveTitle('memory-trainer');
	await expect(page.getByRole('heading', { level: 2, name: 'Numbers' })).toBeVisible();
	await expect(page.getByRole('link', { name: 'Lancer un essai' })).toBeVisible();
});

test('an unknown path is served by the app, which shows its own 404 page (SPA mode)', async ({
	page
}) => {
	// The HTTP status depends on the server (vite preview answers 404, Cloudflare Pages 200):
	// what matters is that the app itself loads and shows its 404 page.
	await page.goto('/does-not-exist');

	await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
});
