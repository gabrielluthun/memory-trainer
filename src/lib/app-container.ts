import { HistoryQuery } from './application/history-query';
import { SettingsService } from './application/settings-service.svelte';
import { TrialSession } from './application/trial-session.svelte';
import { NumbersDiscipline } from './domain/disciplines/numbers';
import { BrowserScheduler } from './infrastructure/browser/browser-scheduler';
import { BrowserMonotonicClock, BrowserWallClock } from './infrastructure/browser/clocks';
import { CryptoIdGenerator } from './infrastructure/browser/crypto-id-generator';
import { CryptoRandomSource } from './infrastructure/browser/crypto-random-source';
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
	const settings = new SettingsService(new DexieSettingsStore(db), wallClock);
	const trials = new DexieTrialStore(db, new TrialMapper());
	const session = new TrialSession({
		discipline: new NumbersDiscipline(),
		clock: new BrowserMonotonicClock(),
		wallClock,
		random: new CryptoRandomSource(),
		ids: new CryptoIdGenerator(),
		scheduler: new BrowserScheduler(),
		repository: trials,
		settings
	});
	return { settings, session, history: new HistoryQuery(trials), ready: settings.load() };
}
