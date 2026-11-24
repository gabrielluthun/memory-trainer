import { describe, expect, it } from 'vitest';
import { FakeAppUpdater } from '../../../tests/fakes/fake-app-updater';
import { FakeAppVersion } from '../../../tests/fakes/fake-app-version';
import { UpdateService } from './update-service.svelte';

function setup(published = '0.1.0') {
	const version = new FakeAppVersion('0.1.0', published);
	const updater = new FakeAppUpdater();
	const update = new UpdateService(version, updater);
	return { update, version, updater };
}

describe('UpdateService — comparing the versions (ADR 0023)', () => {
	it('the device runs the published version: up to date, nothing to download', async () => {
		const { update, updater } = setup('0.1.0');

		expect(await update.checkPublished()).toBe(true);
		expect(update.stale).toBe(false);
		expect(updater.checks).toBe(0);
	});

	it('another version is published: out of date, the service worker downloads it', async () => {
		const { update, updater } = setup('0.2.0');

		expect(await update.checkPublished()).toBe(false);
		expect(update.stale).toBe(true);
		expect(updater.checks).toBe(1);
	});

	it('the download fails (site unreachable): still out of date, no error', async () => {
		const { update, updater } = setup('0.2.0');
		updater.unreachable = true;
		const errors: unknown[] = [];
		const record = (reason: unknown) => errors.push(reason);
		process.on('unhandledRejection', record);

		expect(await update.checkPublished()).toBe(false);
		await new Promise((resolve) => setTimeout(resolve, 0));

		process.off('unhandledRejection', record);
		expect(errors).toEqual([]);
		expect(update.stale).toBe(true);
	});

	it('version.json cannot be read: the check fails, so nothing is sent', async () => {
		const { update } = setup('unreadable');

		await expect(update.checkPublished()).rejects.toThrow();
	});
});

describe('UpdateService — offering the new version (deployment, section 5)', () => {
	it('once the service worker has downloaded a new version, it is ready to install', () => {
		const { update, updater } = setup();
		update.start();
		expect(update.ready).toBe(false);

		updater.announce();

		expect(update.ready).toBe(true);
	});

	it('closing the card hides it until the next opening, the version stays ready', () => {
		const { update, updater } = setup();
		update.start();
		updater.announce();

		update.dismiss();

		expect(update.dismissed).toBe(true);
		expect(update.ready).toBe(true);
	});

	it('"Mettre à jour" installs the downloaded version', async () => {
		const { update, updater } = setup();

		await update.apply();

		expect(updater.applied).toBe(true);
	});
});

describe('UpdateService — never replaced during a trial (deployment, section 5)', () => {
	it('installed here or in another window: the page has to reload, once no trial runs', () => {
		const { update, updater } = setup();
		update.start();
		expect(update.replaced).toBe(false);

		updater.replace();

		expect(update.replaced).toBe(true);
	});
});
