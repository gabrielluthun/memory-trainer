import type { Settings } from '../domain/settings/settings';
import {
	SessionRejected,
	TrialRejected,
	type AuthSession,
	type Cancel,
	type Network,
	type Outbox,
	type RemoteStore,
	type Scheduler,
	type SettingsRepository,
	type TrialRepository,
	type WallClock
} from './ports';

/** Every 5 minutes while the app is open (SEQ05: Neon stays under 100 hours awake a month). */
export const SYNC_INTERVAL_MS = 5 * 60_000;
/** Trials received per page (SEQ05). */
export const PAGE_SIZE = 50;

/**
 * Idle: never tried yet, or offline. Needs sign-in: no session, or the Data API refused it.
 * Failed: network lost or server unreachable; everything not confirmed waits for the next time.
 */
export type SyncState = 'idle' | 'running' | 'done' | 'needs-sign-in' | 'failed';

export interface SyncServiceDeps {
	outbox: Outbox;
	trials: TrialRepository;
	settings: SettingsRepository;
	remote: RemoteStore;
	auth: AuthSession;
	network: Network;
	scheduler: Scheduler;
	wallClock: WallClock;
	/** More recent settings were received: the screens take them (ADR 0012). */
	onSettingsReceived: (settings: Settings) => void;
}

/**
 * Synchronisation (CU17, SEQ05): sends the queued trials, oldest first, then the settings changed
 * on this device; then receives the trials of the other devices, page by page after the cursor,
 * and the settings if more recent. Only one runs at a time; its state is a rune the screens read
 * (ADR 0025).
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

	/**
	 * Return of the network, and every 5 minutes while the app is open (CU17). The other triggers
	 * are the opening, a session created and the end of a trial.
	 */
	startTriggers(): Cancel {
		const { network, scheduler } = this.deps;
		const stopOnline = network.onOnline(() => void this.sync());
		let stopTimer: Cancel = () => {};
		const tick = () => {
			void this.sync();
			stopTimer = scheduler.after(SYNC_INTERVAL_MS, tick);
		};
		stopTimer = scheduler.after(SYNC_INTERVAL_MS, tick);
		return () => {
			stopOnline();
			stopTimer();
		};
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
			await this.#receiveTrials();
			await this.#receiveSettings();
			this.state = 'done';
			this.lastSyncedAt = wallClock.now();
		} catch (error) {
			this.state = error instanceof SessionRejected ? 'needs-sign-in' : 'failed';
		}
	}

	/** Each page is stored with its cursor in one transaction: a cut never skips a trial (ADR 0011). */
	async #receiveTrials(): Promise<void> {
		const { trials, remote } = this.deps;
		let cursor = await trials.readCursor();
		for (;;) {
			const page = await remote.fetchTrials(cursor, PAGE_SIZE);
			if (page.length === 0) return;
			cursor = page[page.length - 1].sequenceNumber;
			await trials.addReceived(page, cursor);
			if (page.length < PAGE_SIZE) return;
		}
	}

	/** The most recent change wins, by the time of the device it was made on (ADR 0012). */
	async #receiveSettings(): Promise<void> {
		const { settings, remote, onSettingsReceived } = this.deps;
		const fromDatabase = await remote.fetchSettings();
		if (!fromDatabase) return;
		const local = await settings.load();
		if (local && fromDatabase.modifiedAt.getTime() <= local.modifiedAt.getTime()) return;
		await settings.saveReceived(fromDatabase);
		onSettingsReceived(fromDatabase);
	}
}
