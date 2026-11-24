import {
	SessionRejected,
	TrialRejected,
	type AuthSession,
	type Network,
	type Outbox,
	type RemoteStore,
	type SettingsRepository,
	type WallClock
} from './ports';

/**
 * Idle: never tried yet, or offline. Needs sign-in: no session, or the Data API refused it.
 * Failed: network lost or server unreachable; everything not confirmed waits for the next time.
 */
export type SyncState = 'idle' | 'running' | 'done' | 'needs-sign-in' | 'failed';

export interface SyncServiceDeps {
	outbox: Outbox;
	settings: SettingsRepository;
	remote: RemoteStore;
	auth: AuthSession;
	network: Network;
	wallClock: WallClock;
}

/**
 * Synchronisation (CU17, SEQ05): sends the queued trials, oldest first, then the settings changed
 * on this device. Only one runs at a time; its state is a rune the screens read (ADR 0025).
 * A refused trial is marked and the queue goes on (ES07); anything else stops it, and what was
 * not confirmed is sent again next time, without a duplicate (RG22).
 */
export class SyncService {
	state = $state<SyncState>('idle');
	/** Device time of the last complete synchronisation. */
	lastSyncedAt = $state<Date | null>(null);

	#running: Promise<void> | null = null;

	constructor(private readonly deps: SyncServiceDeps) {
		deps.auth.onChange((signedIn) => {
			if (signedIn) void this.sync();
		});
	}

	/** A trigger while a synchronisation runs joins it instead of starting another. */
	sync(): Promise<void> {
		this.#running ??= this.#run().finally(() => (this.#running = null));
		return this.#running;
	}

	async #run(): Promise<void> {
		const { outbox, settings, remote, auth, network, wallClock } = this.deps;
		if (!network.isOnline()) return;
		if (!auth.token()) {
			this.state = 'needs-sign-in';
			return;
		}
		this.state = 'running';
		try {
			for (const trial of await outbox.pending()) {
				try {
					await remote.sendTrial(trial);
					await outbox.remove(trial.id);
				} catch (error) {
					if (!(error instanceof TrialRejected)) throw error;
					await outbox.markRejected(trial.id);
				}
			}
			if (await settings.isDirty()) {
				const current = await settings.load();
				if (current) {
					// Sent or ignored as older (ADR 0012): either way, this version is settled.
					await remote.sendSettings(current);
					await settings.markSynced(current.modifiedAt);
				}
			}
			this.state = 'done';
			this.lastSyncedAt = wallClock.now();
		} catch (error) {
			this.state = error instanceof SessionRejected ? 'needs-sign-in' : 'failed';
		}
	}
}
