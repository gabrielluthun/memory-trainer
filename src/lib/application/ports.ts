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

/** Settings stored on the device (Dexie.js). Synchronisation comes with US21. */
export interface SettingsRepository {
	/** The stored settings, or null on a device that never saved any. */
	load(): Promise<Settings | null>;
	save(settings: Settings): Promise<void>;
}

/**
 * The language of the screens (US19, ADR 0029): every text follows it without reloading, and the
 * device keeps a copy to open in the right language. The settings stay the reference.
 */
export interface InterfaceLanguage {
	apply(language: Language): void;
}
