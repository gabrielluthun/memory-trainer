import { expect, test, type Page } from './fixtures';

// US09 (S'entraîner en mode personnalisé), TR01 and TR07. Each test starts on an empty device.

async function openLaunch(page: Page) {
	await page.goto('/');
	await page.getByRole('link', { name: 'Lancer un essai' }).click();
	await expect(page.getByRole('heading', { name: 'Lancer un essai de Numbers' })).toBeVisible();
}

const custom = (page: Page) => page.getByRole('radio', { name: 'Personnalisé' });
const itemCount = (page: Page) => page.getByLabel('Nombre de chiffres');
const duration = (page: Page) => page.getByLabel('Durée de mémorisation');
const start = (page: Page) => page.getByRole('button', { name: 'Commencer' });

/** Memorization cut short, recall left blank: the trial is closed (CU03). */
async function finishTrial(page: Page) {
	await expect(page.getByText(/^Groupe \d+ sur \d+$/)).toBeVisible();
	await page.keyboard.press('Enter');
	await expect(page.getByRole('heading', { name: 'Votre rappel' })).toBeVisible();
	await page.getByRole('button', { name: 'Finished' }).click();
	await expect(page.getByRole('heading', { name: /sur \d+/ })).toBeVisible();
}

async function launchCustom(page: Page, count: string, time: string) {
	await openLaunch(page);
	await custom(page).click();
	await itemCount(page).fill(count);
	await duration(page).fill(time);
	await start(page).click();
}

test('US09 CA1, CA2 — a custom trial of 10 digits, from memorization to result', async ({
	page
}) => {
	await launchCustom(page, '10', '0:20');

	await expect(page.getByText('Personnalisé', { exact: true })).toBeVisible();
	await expect(page.getByText('Groupe 1 sur 5')).toBeVisible();
	await page.keyboard.press('Enter');
	await expect(page.getByRole('heading', { name: 'Votre rappel' })).toBeVisible();
	await expect(page.getByText("10 chiffres, dans l'ordre")).toBeVisible();
	await expect(page.getByRole('button', { name: /^Case \d+,/ })).toHaveCount(10);

	await page.getByRole('button', { name: 'Finished' }).click();
	await expect(page.getByRole('heading', { name: /sur 10/ })).toBeVisible();
});

test('US09 — the standard mode keeps the custom fields locked', async ({ page }) => {
	await openLaunch(page);

	await expect(page.getByRole('radio', { name: 'Standard' })).toBeChecked();
	await expect(itemCount(page)).toBeDisabled();
	await expect(itemCount(page)).toHaveValue('80');
	await expect(duration(page)).toHaveValue('1:00');

	await custom(page).click();
	await expect(itemCount(page)).toBeEnabled();
});

test('CU01 — in custom mode, the plan shows the chosen time and 4 minutes of recall', async ({
	page
}) => {
	await openLaunch(page);
	await custom(page).click();
	await duration(page).fill('2:30');

	const plan = page.getByRole('region', { name: 'Déroulé' });
	await expect(plan).toContainText('2:30');
	await expect(plan).toContainText('4:00');
	await expect(
		page.getByText('En mode personnalisé, le rappel dure toujours 4 minutes.')
	).toBeVisible();
});

test('ADR 0028 — − and + change the time by a step that grows with it', async ({ page }) => {
	await openLaunch(page);
	await custom(page).click();
	await duration(page).fill('0:30');

	await page.getByRole('button', { name: 'Augmenter la durée' }).click();
	await expect(duration(page)).toHaveValue('0:35');
	await page.getByRole('button', { name: 'Diminuer la durée' }).click();
	await page.getByRole('button', { name: 'Diminuer la durée' }).click();
	await expect(duration(page)).toHaveValue('0:25');

	await duration(page).fill('1:00');
	await page.getByRole('button', { name: 'Augmenter la durée' }).click();
	await expect(duration(page)).toHaveValue('1:30');
});

test('RG15 — out of bounds, the field says why and the trial cannot start', async ({ page }) => {
	await openLaunch(page);
	await custom(page).click();

	await itemCount(page).fill('501');
	await expect(page.getByText('De 1 à 500 chiffres.')).toBeVisible();
	await expect(start(page)).toBeDisabled();

	await itemCount(page).fill('10');
	await duration(page).fill('61:00');
	await expect(page.getByText('De 0:01 à 60:00, en minutes et secondes.')).toBeVisible();
	await expect(start(page)).toBeDisabled();

	await duration(page).fill('90');
	await duration(page).blur();
	await expect(duration(page)).toHaveValue('1:30');
	await expect(start(page)).toBeEnabled();
});

test('US09 CA3 — a custom trial is in the history, recognisable by its colour label', async ({
	page
}) => {
	await launchCustom(page, '10', '0:20');
	await finishTrial(page);

	await page.goto('/history');
	const trials = page.getByRole('list', { name: 'Essais' }).getByRole('link');
	await expect(trials).toHaveCount(1);
	await expect(trials.first()).toContainText('Personnalisé, 10');
});

test('US09 CA4 — the next launch proposes the last mode and custom settings', async ({ page }) => {
	await launchCustom(page, '12', '0:45');
	await finishTrial(page);

	await openLaunch(page);

	await expect(custom(page)).toBeChecked();
	await expect(itemCount(page)).toHaveValue('12');
	await expect(duration(page)).toHaveValue('0:45');
});
