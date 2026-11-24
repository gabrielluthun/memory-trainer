import { describe, expect, it } from 'vitest';
import { FakeInstallContext } from '../../../tests/fakes/fake-install-context';
import { InstallService } from './install-service.svelte';

describe('InstallService — at opening (CU18)', () => {
	it('iPhone or iPad without installation: the reminder shows', async () => {
		const install = new InstallService(new FakeInstallContext(false, true));

		await install.open();

		expect(install.reminding).toBe(true);
	});

	it('another device without installation: no reminder, the browser offers it itself', async () => {
		const install = new InstallService(new FakeInstallContext(false, false));

		await install.open();

		expect(install.reminding).toBe(false);
	});

	it('installed: no reminder, the persistent storage is asked for', async () => {
		const context = new FakeInstallContext(true, true);
		const install = new InstallService(context);

		await install.open();

		expect(install.reminding).toBe(false);
		expect(context.persistRequests).toBe(1);
	});

	it('not installed: the persistent storage is not asked for', async () => {
		const context = new FakeInstallContext(false, true);

		await new InstallService(context).open();

		expect(context.persistRequests).toBe(0);
	});

	it('the persistent storage cannot be asked for: the app opens all the same', async () => {
		const context = new FakeInstallContext(true, false);
		context.persistFails = true;

		await expect(new InstallService(context).open()).resolves.toBeUndefined();
	});

	it('"Plus tard" closes the reminder until the next opening', async () => {
		const install = new InstallService(new FakeInstallContext(false, true));
		await install.open();

		install.later();

		expect(install.reminding).toBe(false);
	});
});
