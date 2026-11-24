import type { DisciplineName, ItemResult } from '../domain/disciplines/discipline';
import type { Language, Settings } from '../domain/settings/settings';
import type { ClosedTrial, Mode, TrialId, TrialSnapshot } from '../domain/trial/trial';

/**
 * What the Application layer expects from the outside world (ADR 0013).
 * Implemented in the Infrastructure layer; faked in memory in the tests.
 */

/** Wall-clock time, to date trials and settings. `new Date()` in the browser. */
export interface WallClock {
	now(): Date;
}

/** Identifiers created on the device (ES06). `crypto.randomUUID()` in the browser. */
export interface IdGenerator {
	next(): TrialId;
}

/** Cancels a scheduled task. */
export type Cancel = () => void;

/** Timers for countdowns, automatic stops and periodic saves. */
export interface Scheduler {
	after(delayMs: number, task: () => void): Cancel;
}

/**
 * A stored trial as the history lists it (US12). A read model: stored trials are never turned
 * back into domain objects, since nothing can change them any more (RG18).
 */
export interface TrialSummary {
	id: TrialId;
	discipline: DisciplineName;
	mode: Mode;
	/** "completed", "abandoned" or "external_error" (RG23, RG24). */
	status: string;
	startedAt: Date;
	itemCount: number;
	/** Null for a trial kept out of the statistics (US10). */
	score: number | null;
	memorizationMs: number | null;
	/** Refused by the database (ES07): kept on the device, never sent (SEQ05). */
	rejected: boolean;
}

/** A stored trial with its detail, item by item (US11, RG19). */
export interface TrialDetail extends TrialSummary {
	recallMs: number | null;
	results: ItemResult<number, number>[];
}

/** Trials stored on the device (Dexie.js). */
export interface TrialRepository {
	/**
	 * Keeps the ongoing trial on the device, replacing the previous save (SEQ02). Never sent: it
	 * only joins the upload queue once closed (CU06). Ignored if that trial is already closed.
	 */
	saveSnapshot(snapshot: TrialSnapshot): Promise<void>;
	/** The ongoing trial left on the device, if any: an interrupted trial at reopening (RG24). */
	loadSnapshot(): Promise<TrialSnapshot | null>;
	/** Erases the ongoing trial with this id, if it is the one on the device ("Ne pas garder"). */
	deleteSnapshot(id: TrialId): Promise<void>;
	/**
	 * Stores a closed trial, counted or excluded, adds it to the upload queue and erases its
	 * ongoing save, in one transaction.
	 */
	close(trial: ClosedTrial): Promise<void>;
	/** Every stored trial, most recent first (US12 CA1). */
	list(): Promise<TrialSummary[]>;
	/** One stored trial with its detail, or null if the device does not have it (US12 CA2). */
	get(id: TrialId): Promise<TrialDetail | null>;
}

/** Settings stored on the device (Dexie.js), with a mark "to send" (SEQ05). */
export interface SettingsRepository {
	/** The stored settings, or null on a device that never saved any. */
	load(): Promise<Settings | null>;
	/** A change made on this device: marked to send. */
	save(settings: Settings): Promise<void>;
	/** Changed on this device since the last time they were sent. */
	isDirty(): Promise<boolean>;
	/** Sent: unmarked, unless they changed again since that version (`modifiedAt`). */
	markSynced(modifiedAt: Date): Promise<void>;
}

/**
 * A closed trial waiting in the upload queue. Its record is the stored form of the trial, which
 * the Infrastructure sends as it is: the Application only moves it along (ADR 0010).
 */
export interface QueuedTrial {
	id: TrialId;
	record: unknown;
}

/** The upload queue (SEQ05), kept with the trials in Dexie.js. */
export interface Outbox {
	/** Trials waiting to be sent, oldest first. */
	pending(): Promise<QueuedTrial[]>;
	/** Received by the database (or already there): out of the queue. */
	remove(id: TrialId): Promise<void>;
	/** Refused by the database (ES07): out of the queue, kept on the device and shown as refused. */
	markRejected(id: TrialId): Promise<void>;
}

/** The Data API refused the session token: the practitioner signs in again (SEQ05). */
export class SessionRejected extends Error {
	override name = 'SessionRejected';
}

/** The database refused a trial (ES07): a defect of the app, never a reason to block the queue. */
export class TrialRejected extends Error {
	override name = 'TrialRejected';
}

/**
 * What the app expects from the server, without knowing it is Neon (class diagram). Any other
 * failure (network, server asleep or down) rejects with an ordinary error: retried later.
 */
export interface RemoteStore {
	/** Sends a closed trial; "duplicate" if the database already has it (RG22, ES06). */
	sendTrial(trial: QueuedTrial): Promise<'inserted' | 'duplicate'>;
	/** Sends the settings; "ignored" if the database has a more recent change (ADR 0012). */
	sendSettings(settings: Settings): Promise<'saved' | 'ignored'>;
}

/**
 * The language of the screens (US19, ADR 0029): every text follows it without reloading, and the
 * device keeps a copy to open in the right language. The settings stay the reference.
 */
export interface InterfaceLanguage {
	apply(language: Language): void;
}

/**
 * The session of the practitioner (CU16, ADR 0030), without knowing it is Hanko. Signing in itself
 * happens in Hanko's own screen; the app only reads the session and follows its changes.
 */
export interface AuthSession {
	/** Asks Hanko whether the session is still open (network). Rejects when Hanko is unreachable. */
	isValid(): Promise<boolean>;
	/** The session token (JWT) for the Data API, or null without a session. */
	token(): string | null;
	/** Ends the session of this device (ES03). */
	signOut(): Promise<void>;
	/** Called with true when a session starts, false when it ends or expires. */
	onChange(listener: (signedIn: boolean) => void): Cancel;
}

/** Whether the device is online. `navigator.onLine` in the browser. */
export interface Network {
	isOnline(): boolean;
}
