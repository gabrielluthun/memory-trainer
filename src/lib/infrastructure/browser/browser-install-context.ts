import type { InstallContext } from '../../application/ports';

/** What the adapter reads from the browser: replaced in the tests. */
export interface BrowserDevice {
	userAgent: string;
	maxTouchPoints: number;
	/** `display-mode: standalone`: opened from its icon, in its own window. */
	standaloneDisplay: boolean;
	/** `navigator.standalone`, true when opened from the home screen of an iPhone or iPad. */
	appleStandalone?: boolean;
	/** `navigator.storage.persist`, missing in browsers without the storage API. */
	persist?: () => Promise<boolean>;
}

/** The device as the browser describes it, read when the app opens. */
export function currentDevice(): BrowserDevice {
	const nav = navigator as Navigator & { standalone?: boolean };
	return {
		userAgent: nav.userAgent,
		maxTouchPoints: nav.maxTouchPoints,
		standaloneDisplay: window.matchMedia('(display-mode: standalone)').matches,
		appleStandalone: nav.standalone,
		persist: nav.storage?.persist ? () => nav.storage.persist() : undefined
	};
}

/** Implements InstallContext (CU18, technical constraints). */
export class BrowserInstallContext implements InstallContext {
	constructor(private readonly device: BrowserDevice) {}

	isInstalled(): boolean {
		return this.device.standaloneDisplay || this.device.appleStandalone === true;
	}

	/** iPadOS Safari presents itself as a Mac: only the touch screen tells them apart. */
	isAppleMobile(): boolean {
		const { userAgent, maxTouchPoints } = this.device;
		return (
			/iPhone|iPad|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && maxTouchPoints > 1)
		);
	}

	async persist(): Promise<boolean> {
		return (await this.device.persist?.()) ?? false;
	}
}
