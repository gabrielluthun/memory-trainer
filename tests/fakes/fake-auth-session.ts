import type { AuthSession, Cancel } from '../../src/lib/application/ports';

/** Test double for the AuthSession: a session Hanko would report, and its events on demand. */
export class FakeAuthSession implements AuthSession {
	signOuts = 0;
	checks = 0;
	private listeners = new Set<(signedIn: boolean) => void>();

	/** What Hanko answers; `unreachable` makes the check fail like a network error. */
	constructor(public answer: 'valid' | 'invalid' | 'unreachable' = 'invalid') {}

	isValid(): Promise<boolean> {
		this.checks++;
		if (this.answer === 'unreachable') return Promise.reject(new Error('Hanko unreachable'));
		return Promise.resolve(this.answer === 'valid');
	}

	token(): string | null {
		return this.answer === 'valid' ? 'fake.jwt.token' : null;
	}

	signOut(): Promise<void> {
		this.signOuts++;
		this.answer = 'invalid';
		this.emit(false);
		return Promise.resolve();
	}

	onChange(listener: (signedIn: boolean) => void): Cancel {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	/** Hanko reports a session created (passkey accepted) or ended. */
	emit(signedIn: boolean): void {
		this.answer = signedIn ? 'valid' : 'invalid';
		for (const listener of this.listeners) listener(signedIn);
	}
}
