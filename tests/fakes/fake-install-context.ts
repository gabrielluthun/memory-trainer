import type { InstallContext } from '../../src/lib/application/ports';

/** Test double for the InstallContext: the device, and the persistent storage asked for. */
export class FakeInstallContext implements InstallContext {
	persistRequests = 0;
	/** Makes the request fail, as a browser without the storage API would. */
	persistFails = false;

	constructor(
		public installed = false,
		public appleMobile = false
	) {}

	isInstalled(): boolean {
		return this.installed;
	}

	isAppleMobile(): boolean {
		return this.appleMobile;
	}

	persist(): Promise<boolean> {
		this.persistRequests++;
		return this.persistFails ? Promise.reject(new Error('no storage API')) : Promise.resolve(true);
	}
}
