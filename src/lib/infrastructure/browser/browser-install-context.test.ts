import { describe, expect, it } from 'vitest';
import { BrowserInstallContext, type BrowserDevice } from './browser-install-context';

const IPHONE =
	'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const IPAD_AS_MAC =
	'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15';
const ANDROID =
	'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36';

function device(overrides: Partial<BrowserDevice> = {}): BrowserDevice {
	return {
		userAgent: ANDROID,
		maxTouchPoints: 0,
		standaloneDisplay: false,
		persist: () => Promise.resolve(true),
		...overrides
	};
}

describe('BrowserInstallContext — installed or not (CU18)', () => {
	it('opened in its own window: installed', () => {
		expect(new BrowserInstallContext(device({ standaloneDisplay: true })).isInstalled()).toBe(true);
	});

	it('opened from the home screen of an iPhone (navigator.standalone): installed', () => {
		expect(new BrowserInstallContext(device({ appleStandalone: true })).isInstalled()).toBe(true);
	});

	it('opened in a browser tab: not installed', () => {
		expect(new BrowserInstallContext(device()).isInstalled()).toBe(false);
	});
});

describe('BrowserInstallContext — iPhone or iPad (technical constraints)', () => {
	it('an iPhone', () => {
		expect(new BrowserInstallContext(device({ userAgent: IPHONE })).isAppleMobile()).toBe(true);
	});

	it('an iPad, which presents itself as a Mac with a touch screen', () => {
		const ipad = device({ userAgent: IPAD_AS_MAC, maxTouchPoints: 5 });
		expect(new BrowserInstallContext(ipad).isAppleMobile()).toBe(true);
	});

	it('a Mac, without a touch screen, and an Android phone are not', () => {
		const mac = device({ userAgent: IPAD_AS_MAC, maxTouchPoints: 0 });
		expect(new BrowserInstallContext(mac).isAppleMobile()).toBe(false);
		expect(new BrowserInstallContext(device()).isAppleMobile()).toBe(false);
	});
});

describe('BrowserInstallContext — persistent storage', () => {
	it('asks the browser, and says what it answered', async () => {
		const refused = device({ persist: () => Promise.resolve(false) });
		expect(await new BrowserInstallContext(refused).persist()).toBe(false);
	});

	it('a browser without the storage API: not kept', async () => {
		expect(await new BrowserInstallContext(device({ persist: undefined })).persist()).toBe(false);
	});
});
