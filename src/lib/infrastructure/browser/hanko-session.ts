import { register, type Hanko } from '@teamhanko/hanko-elements';
import { en } from '@teamhanko/hanko-elements/i18n/en';
import { fr } from '@teamhanko/hanko-elements/i18n/fr';
import type { AuthSession, Cancel, Network } from '../../application/ports';

/**
 * The Hanko session (ADR 0030). Registering defines the <hanko-auth> element of the sign-in
 * screen and creates the SDK, which keeps the token in a secure cookie (SE6) and reports when a
 * session is created or expires.
 */
export class HankoSession implements AuthSession {
	private readonly hanko: Promise<Hanko>;
	private current: Hanko | null = null;

	constructor(apiUrl: string) {
		this.hanko = register(apiUrl, {
			translations: { fr, en },
			fallbackLanguage: 'fr',
			enablePasskeys: true,
			sessionTokenLocation: 'cookie',
			cookieSameSite: 'strict'
		}).then(({ hanko }) => (this.current = hanko));
	}

	async isValid(): Promise<boolean> {
		const hanko = await this.hanko;
		return (await hanko.validateSession()).is_valid;
	}

	token(): string | null {
		return this.current?.getSessionToken() || null;
	}

	async signOut(): Promise<void> {
		await (await this.hanko).logout();
	}

	onChange(listener: (signedIn: boolean) => void): Cancel {
		let cleanups: Cancel[] = [];
		let cancelled = false;
		void this.hanko.then((hanko) => {
			if (cancelled) return;
			cleanups = [
				hanko.onSessionCreated(() => listener(true)),
				hanko.onSessionExpired(() => listener(false)),
				hanko.onUserLoggedOut(() => listener(false))
			];
		});
		return () => {
			cancelled = true;
			for (const cleanup of cleanups) cleanup();
		};
	}
}

/** `navigator.onLine`: false means surely offline; true only that a network is there. */
export class BrowserNetwork implements Network {
	isOnline(): boolean {
		return navigator.onLine;
	}

	onOnline(listener: () => void): Cancel {
		window.addEventListener('online', listener);
		return () => window.removeEventListener('online', listener);
	}
}
