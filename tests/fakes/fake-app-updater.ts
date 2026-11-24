import type { AppUpdater } from '../../src/lib/application/ports';

/** Test double for the AppUpdater: records the checks and the installation, announces on demand. */
export class FakeAppUpdater implements AppUpdater {
	checks = 0;
	applied = false;
	/** Makes `check()` fail, as when the site cannot be reached. */
	unreachable = false;
	private onReady: (() => void) | null = null;
	private onReplaced: (() => void) | null = null;

	start(onReady: () => void, onReplaced: () => void): void {
		this.onReady = onReady;
		this.onReplaced = onReplaced;
	}

	check(): Promise<void> {
		this.checks++;
		return this.unreachable ? Promise.reject(new Error('site unreachable')) : Promise.resolve();
	}

	apply(): Promise<void> {
		this.applied = true;
		return Promise.resolve();
	}

	/** The service worker has downloaded a new version. */
	announce(): void {
		this.onReady?.();
	}

	/** The new version was installed, here or in another window, and now serves the app. */
	replace(): void {
		this.onReplaced?.();
	}
}
