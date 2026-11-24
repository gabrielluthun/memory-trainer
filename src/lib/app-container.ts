import { PUBLIC_DATA_API_URL, PUBLIC_HANKO_API_URL } from '$app/env/public';
import { ConnectionService } from './application/connection-service.svelte';
import { HistoryQuery } from './application/history-query';
import { notifyOnClose } from './application/notify-on-close';
import { InterruptedTrialRecovery } from './application/interrupted-trial-recovery';
import { SettingsService } from './application/settings-service.svelte';
import { SyncService } from './application/sync-service.svelte';
import { TrialSession } from './application/trial-session.svelte';
import { NumbersDiscipline } from './domain/disciplines/numbers';
import { BrowserScheduler } from './infrastructure/browser/browser-scheduler';
import { BrowserMonotonicClock, BrowserWallClock } from './infrastructure/browser/clocks';
import { CryptoIdGenerator } from './infrastructure/browser/crypto-id-generator';
import { CryptoRandomSource } from './infrastructure/browser/crypto-random-source';
import { BrowserNetwork, HankoSession } from './infrastructure/browser/hanko-session';
import {
	deviceStorage,
	ParaglideInterfaceLanguage
} from './infrastructure/browser/paraglide-interface-language.svelte';
import { DataApiClient } from './infrastructure/data-api/data-api-client';
import { MemoryTrainerDatabase } from './infrastructure/dexie/database';
import { DexieSettingsStore } from './infrastructure/dexie/dexie-settings-store';
import { DexieTrialStore } from './infrastructure/dexie/dexie-trial-store';
import { TrialMapper } from './infrastructure/trial-mapper';

/**
 * Creates every object at start-up and wires them together: the only place that knows the
 * concrete classes (AppContainer in the class diagram).
 */
export interface App {
	settings: SettingsService;
	session: TrialSession;
	history: HistoryQuery;
	/** At opening, the choice for a trial interrupted by an outside incident (CU06). */
	recovery: InterruptedTrialRecovery;
	/** Signing in (CU16): checked at opening, online only. */
	connection: ConnectionService;
	/** Synchronisation (CU17): opening, session created, end of a trial, network back, every 5 min. */
	sync: SyncService;
	/** Resolves once the settings of the device are loaded. */
	ready: Promise<void>;
}

let app: App | null = null;

export function getApp(): App {
	app ??= build();
	return app;
}

function build(): App {
	const db = new MemoryTrainerDatabase();
	const wallClock = new BrowserWallClock();
	// Created first: every text reads its language, from the very first screen (ADR 0029).
	const language = new ParaglideInterfaceLanguage(deviceStorage(), document.documentElement);
	const settingsStore = new DexieSettingsStore(db);
	const settings = new SettingsService(settingsStore, wallClock, language);
	const trials = new DexieTrialStore(db, new TrialMapper());
	const discipline = new NumbersDiscipline();
	const clock = new BrowserMonotonicClock();
	const scheduler = new BrowserScheduler();
	// One Hanko session for signing in and for the token of the Data API (ADR 0030, ADR 0031).
	const auth = new HankoSession(PUBLIC_HANKO_API_URL);
	const network = new BrowserNetwork();
	const sync = new SyncService({
		outbox: trials,
		trials,
		settings: settingsStore,
		remote: new DataApiClient(PUBLIC_DATA_API_URL, auth, [discipline]),
		auth,
		network,
		scheduler,
		wallClock,
		onSettingsReceived: (received) => settings.adopt(received)
	});
	// Every way of closing a trial ends with a synchronisation (CU17).
	const closing = notifyOnClose(trials, () => void sync.sync());
	const session = new TrialSession({
		discipline,
		clock,
		wallClock,
		random: new CryptoRandomSource(),
		ids: new CryptoIdGenerator(),
		scheduler,
		repository: closing,
		settings
	});
	return {
		settings,
		session,
		history: new HistoryQuery(trials),
		recovery: new InterruptedTrialRecovery({ discipline, clock, repository: closing }),
		connection: new ConnectionService(auth, network),
		sync,
		ready: settings.load()
	};
}
