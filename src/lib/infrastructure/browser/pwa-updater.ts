import { registerSW } from 'virtual:pwa-register';
import type { AppUpdater } from '../../application/ports';

/**
 * Implements AppUpdater with the service worker of the PWA plugin, in "prompt" mode (ADR 0008):
 * a new version waits for the practitioner. Its own reload is replaced by `onReplaced`, so that a
 * version installed from another window never reloads this one during a trial (deployment,
 * section 5). Checked at acceptance (TR14): a real service worker cannot be swapped in the tests.
 */
export class PwaUpdater implements AppUpdater {
	#install: (() => Promise<void>) | null = null;
	#registration: ServiceWorkerRegistration | undefined;

	start(onReady: () => void, onReplaced: () => void): void {
		this.#install = registerSW({
			immediate: true,
			onNeedRefresh: onReady,
			onNeedReload: onReplaced,
			onRegisteredSW: (_url, registration) => (this.#registration = registration)
		});
	}

	/** Without a registered service worker (blocked, or not yet there), there is nothing to check. */
	async check(): Promise<void> {
		await this.#registration?.update();
	}

	async apply(): Promise<void> {
		await this.#install?.();
	}
}
