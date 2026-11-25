import type { InstallContext } from './ports';

/**
 * Installing the app (CU18, mock-up 12), as a rune the screens read (ADR 0025). On iPhone and iPad,
 * Safari may erase the data of an app that is not installed (technical constraints): a reminder
 * shows at every opening until it is. Once installed, the app asks to keep its data.
 */
export class InstallService {
	/** The installation reminder is shown. */
	reminding = $state(false);

	constructor(private readonly context: InstallContext) {}

	async open(): Promise<void> {
		if (!this.context.isInstalled()) {
			this.reminding = this.context.isAppleMobile();
			return;
		}
		// Not worth blocking the app: without it, the browser decides alone what it keeps.
		await this.context.persist().catch(() => false);
	}

	/** "Plus tard": until the next opening. */
	later(): void {
		this.reminding = false;
	}
}
