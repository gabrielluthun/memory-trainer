import type { Settings } from '../domain/settings/settings';
import type { CompletedTrial, TrialId } from '../domain/trial/trial';

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

/** Trials stored on the device (Dexie.js). Lot 1, US01: closing a completed trial. */
export interface TrialRepository {
	/** Stores a closed trial and adds it to the upload queue, in one transaction. */
	close(trial: CompletedTrial): Promise<void>;
}

/** Settings stored on the device (Dexie.js). Synchronisation comes with US21. */
export interface SettingsRepository {
	/** The stored settings, or null on a device that never saved any. */
	load(): Promise<Settings | null>;
	save(settings: Settings): Promise<void>;
}
