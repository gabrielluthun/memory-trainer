import type { AppUpdater, AppVersion } from './ports';

/**
 * A new version of the app (deployment, section 5; ADR 0023), as runes the screens read (ADR 0025).
 */
export class UpdateService {
	/** The published version differs from the one of this device: the synchronisation waits. */
	stale = $state(false);
	/** A new version is downloaded: the card offers it, outside a trial. */
	ready = $state(false);
	/** The card was closed: hidden until the next opening; the status still says the sync waits. */
	dismissed = $state(false);
	/**
	 * The new version was installed, here or in another window, and now serves the app: the page
	 * reloads as soon as no trial runs, never during one.
	 */
	replaced = $state(false);

	constructor(
		private readonly version: AppVersion,
		private readonly updater: AppUpdater
	) {}

	/** At opening: the service worker keeps the app on the device (ENF02) and finds new versions. */
	start(): void {
		this.updater.start(
			() => (this.ready = true),
			() => (this.replaced = true)
		);
	}

	dismiss(): void {
		this.dismissed = true;
	}

	/** "Mettre à jour": the downloaded version replaces this one, and the page reloads. */
	apply(): Promise<void> {
		return this.updater.apply();
	}

	/** Before each synchronisation (SEQ05): true when this device runs the published version. */
	async checkPublished(): Promise<boolean> {
		const published = await this.version.published();
		this.stale = published !== this.version.local;
		// The service worker may not have seen it yet: it downloads it now, in the background. If the
		// site cannot be reached, the next synchronisation tries again.
		if (this.stale) this.updater.check().catch(() => {});
		return !this.stale;
	}
}
