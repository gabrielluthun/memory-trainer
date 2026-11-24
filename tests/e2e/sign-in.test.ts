import { expect, SESSION_TOKEN, test } from './fixtures';

// CU16 (Se connecter), mock-up 11, ADR 0030. Hanko is simulated (fixtures.ts); its own sign-in
// flow is checked at acceptance, in production (TR09).

const signInTitle = (page: import('./fixtures').Page) =>
	page.getByRole('heading', { name: 'Se connecter', level: 1 });

test.describe('without a session', () => {
	test.use({ session: 'invalid' });

	test('CU16 — online without a session, the sign-in screen opens with Hanko inside', async ({
		page
	}) => {
		await page.goto('/');

		await expect(signInTitle(page)).toBeVisible();
		await expect(page.locator('hanko-auth')).toHaveAttribute('lang', 'fr');
		await expect(page.getByRole('navigation')).toHaveCount(0);
	});

	test('CU16 — "Continuer hors connexion" opens the app, and the screen comes back at the next opening', async ({
		page
	}) => {
		await page.goto('/');
		await page.getByRole('button', { name: 'Continuer hors connexion' }).click();

		await expect(page.getByRole('link', { name: 'Lancer un essai' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Non connecté' })).toBeVisible();

		await page.reload();
		await expect(signInTitle(page)).toBeVisible();
	});

	test('CU16 — "Non connecté" opens the sign-in screen at any time', async ({ page }) => {
		await page.goto('/');
		await page.getByRole('button', { name: 'Continuer hors connexion' }).click();

		await page.getByRole('button', { name: 'Non connecté' }).click();

		await expect(signInTitle(page)).toBeVisible();
	});

	test('CU16 — a session created by Hanko closes the screen', async ({ page, hanko, baseURL }) => {
		await page.goto('/');
		await expect(signInTitle(page)).toBeVisible();

		// What Hanko does once the passkey is accepted: its cookie, then its event.
		hanko.valid = true;
		await page.context().addCookies([{ name: 'hanko', value: SESSION_TOKEN, url: baseURL ?? '' }]);
		await page.evaluate(() => {
			const expiration = Math.floor(Date.now() / 1000) + 12 * 3600;
			document.dispatchEvent(
				new CustomEvent('hanko-session-created', {
					detail: { claims: { subject: 'practitioner', expiration }, expirationSeconds: 43200 }
				})
			);
		});

		await expect(page.getByRole('link', { name: 'Lancer un essai' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Non connecté' })).toHaveCount(0);
	});

	test('CU16 — offline at opening, nothing is asked: the device data are enough', async ({
		page
	}) => {
		await page.addInitScript(() =>
			Object.defineProperty(Navigator.prototype, 'onLine', { get: () => false })
		);

		await page.goto('/');

		await expect(page.getByRole('link', { name: 'Lancer un essai' })).toBeVisible();
		await expect(signInTitle(page)).toHaveCount(0);
	});
});

test('ES03 — signing out from the settings ends the session, without asking to sign in again', async ({
	page
}) => {
	await page.goto('/settings');
	await expect(page.getByText('Connecté avec une passkey')).toBeVisible();

	await page.getByRole('button', { name: 'Se déconnecter' }).click();

	await expect(page.getByText('Non connecté : vos essais restent sur cet appareil.')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Non connecté' })).toBeVisible();
	await expect(signInTitle(page)).toHaveCount(0);
});

test('US19 — the sign-in screen follows the interface language', async ({ page, hanko }) => {
	await page.goto('/settings');
	await page.getByRole('radio', { name: 'English' }).click();
	await expect(page.getByText('Saved on this device.')).toBeVisible();
	hanko.valid = false;

	await page.reload();

	await expect(page.getByRole('heading', { name: 'Sign in', level: 1 })).toBeVisible();
	await expect(page.locator('hanko-auth')).toHaveAttribute('lang', 'en');
});
