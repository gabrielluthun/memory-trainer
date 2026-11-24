import type { AuthSession, Network } from './ports';

/** Unknown: offline, or Hanko could not be reached; the app works the same with the device data. */
export type ConnectionStatus = 'unknown' | 'signed-in' | 'signed-out';

/**
 * Signing in (CU16, mock-up 11), as runes the screens read (ADR 0025). At opening, online and
 * without a session, the sign-in screen is shown; "Continuer hors connexion" closes it until the
 * next opening, and the "Non connecté" status opens it again at any time.
 */
export class ConnectionService {
	status = $state<ConnectionStatus>('unknown');
	/** Whether the sign-in screen is shown. */
	prompting = $state(false);

	constructor(
		private readonly auth: AuthSession,
		private readonly network: Network
	) {
		auth.onChange((signedIn) => {
			this.status = signedIn ? 'signed-in' : 'signed-out';
			if (signedIn) this.prompting = false;
		});
	}

	/** At opening: a session is only checked online, where signing in is possible. */
	async open(): Promise<void> {
		if (!this.network.isOnline()) return;
		try {
			const valid = await this.auth.isValid();
			this.status = valid ? 'signed-in' : 'signed-out';
			this.prompting = !valid;
		} catch {
			// Hanko unreachable: the device data stay usable, nothing to ask.
		}
	}

	/** "Continuer hors connexion": the trials wait in the upload queue. */
	dismiss(): void {
		this.prompting = false;
	}

	/** The "Non connecté" status, or "Se connecter" in the settings. */
	ask(): void {
		this.prompting = true;
	}

	async signOut(): Promise<void> {
		await this.auth.signOut();
		this.status = 'signed-out';
		this.prompting = false;
	}
}
