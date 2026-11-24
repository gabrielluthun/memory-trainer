import type { Cancel, Network } from '../../src/lib/application/ports';

/** Test double for the Network: online or not, and the return of the network on demand. */
export class FakeNetwork implements Network {
	private listeners = new Set<() => void>();

	constructor(public online = true) {}

	isOnline(): boolean {
		return this.online;
	}

	onOnline(listener: () => void): Cancel {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	/** The network comes back, as the browser's "online" event says. */
	comeBack(): void {
		this.online = true;
		for (const listener of this.listeners) listener();
	}
}
