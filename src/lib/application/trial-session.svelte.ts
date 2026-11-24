import type { Digit, NumbersDiscipline } from '../domain/disciplines/numbers';
import type { DisciplineName } from '../domain/disciplines/discipline';
import type { Format } from '../domain/format';
import type { DisplayPattern } from '../domain/navigation/display-pattern';
import type { RandomSource } from '../domain/random';
import type { SequenceRecall } from '../domain/recall/sequence-recall';
import type { Settings } from '../domain/settings/settings';
import type { MonotonicClock } from '../domain/timing/timing';
import {
	PausedBeforeMemorization,
	type PreparationPauses,
	type CompletedTrial,
	type MemorizingTrial,
	type PausedBeforeRecall,
	type PendingDecision,
	type RecallingTrial
} from '../domain/trial/trial';
import type { Cancel, IdGenerator, Scheduler, TrialRepository, WallClock } from './ports';

export interface TrialSessionDependencies {
	discipline: NumbersDiscipline;
	clock: MonotonicClock;
	wallClock: WallClock;
	random: RandomSource;
	ids: IdGenerator;
	scheduler: Scheduler;
	repository: TrialRepository;
	/** The current settings, read at launch (US07 CA1bis); the pauses chosen are kept there (RG25). */
	settings: {
		readonly current: Settings;
		setPauses(discipline: DisciplineName, pauses: PreparationPauses): Promise<void>;
	};
}

export type TrialPhase =
	| PausedBeforeMemorization
	| MemorizingTrial
	| PausedBeforeRecall
	| RecallingTrial
	| PendingDecision
	| CompletedTrial;

/** The phases saved on the device while they run (SEQ02). */
type OngoingPhase = MemorizingTrial | PausedBeforeRecall | RecallingTrial;

/** The ongoing trial is saved every 2 s: at most 2 s lost after an interruption (SEQ02). */
const SAVE_INTERVAL_MS = 2_000;

/** The three choices offered after an abandon (RG23). */
export type AbandonChoice = 'keep-out-of-stats' | 'count-as-is' | 'discard';

/**
 * Runs one trial from launch to closing (CU01 to CU04): chains the phases, stops memorization
 * and recall when their time is up, and closes the trial in the repository.
 * The rules live in the domain; this class only orchestrates and exposes state to the screens
 * (Svelte runes, ADR 0025).
 */
export class TrialSession {
	current = $state<TrialPhase | null>(null);
	answers = $state<(Digit | null)[]>([]);
	selected = $state(0);
	memorizationMs = $state<number | null>(null);
	/** Display pattern of the trial in progress, fixed at launch (RG11). */
	displayPattern = $state<DisplayPattern>([2]);
	groupIndex = $state(0);
	groupCount = $state(0);
	group = $state<Digit[]>([]);

	#cancelPending: Cancel | null = null;
	#cancelSaves: Cancel | null = null;
	/** The storing of the trial being closed, if any. */
	#closing: Promise<void> | null = null;
	/**
	 * Writes to the repository, one after the other: a save started before the trial is closed
	 * or erased can never land after it and bring it back.
	 */
	#writes: Promise<void> = Promise.resolve();

	constructor(private readonly deps: TrialSessionDependencies) {}

	/** US01: a standard trial. */
	start(options: { pauses?: PreparationPauses } = {}): void {
		const { discipline, random, ids, wallClock, clock } = this.deps;
		this.#stopSaving();
		const format = discipline.standardFormat();
		this.displayPattern = this.deps.settings.current.groupPatternFor(discipline.name);
		const pauses = options.pauses ?? this.deps.settings.current.pausesFor(discipline.name);
		if (options.pauses) {
			// RG25: the pauses chosen become the ones proposed next time. Not worth blocking the trial.
			void this.deps.settings.setPauses(discipline.name, pauses).catch(() => {});
		}
		const paused = PausedBeforeMemorization.begin(
			{
				id: ids.next(),
				discipline,
				mode: 'standard',
				format,
				pauses,
				displayPattern: this.displayPattern,
				items: discipline.draw(format.itemCount, random),
				startedAt: wallClock.now()
			},
			clock
		);
		this.#show(paused);
		this.#schedule(paused.countdown.remainingMs(), () => this.#startMemorization());
	}

	/** "Commencer maintenant": the next phase starts at once (US23 CA3). */
	skipPause(): void {
		if (this.current?.phase === 'paused-before-memorization') this.#startMemorization();
		else if (this.current?.phase === 'paused-before-recall') this.#startRecall();
	}

	/**
	 * Abandon during the pause before memorization: nothing was recorded, nothing is asked
	 * (US23 CA6, RG25). Abandoning later offers three choices and comes with US10.
	 */
	cancel(): void {
		if (this.current?.phase !== 'paused-before-memorization') return;
		this.#cancelPending?.();
		this.#cancelPending = null;
		this.current = null;
	}

	/**
	 * Abandon (CU05). During the first pause, nothing was recorded: the trial is dropped, nothing
	 * is asked (RG25). Later, the timers stop for good and the trial waits for a choice (RG23).
	 */
	abandon(): void {
		const trial = this.current;
		if (trial?.phase === 'paused-before-memorization') return this.cancel();
		if (
			trial?.phase !== 'memorizing' &&
			trial?.phase !== 'paused-before-recall' &&
			trial?.phase !== 'recalling'
		)
			return;
		// Saved as it stops: closing the tab before choosing makes it an interrupted trial (RG24).
		this.#stopSaving();
		this.#save(trial);
		this.#show(trial.abandon());
	}

	/** Saves the ongoing trial now, e.g. when the tab goes to the background (SEQ02). */
	saveNow(): void {
		const trial = this.current;
		if (
			trial?.phase === 'memorizing' ||
			trial?.phase === 'paused-before-recall' ||
			trial?.phase === 'recalling'
		)
			this.#save(trial);
	}

	/**
	 * The practitioner's choice after an abandon (RG23). "Compter tel quel" shows the result;
	 * the two others leave the trial. A stored trial is stored before anything changes on screen.
	 */
	async decide(choice: AbandonChoice): Promise<void> {
		const pending = this.current;
		if (pending?.phase !== 'pending-decision') return;
		const { repository } = this.deps;
		if (choice === 'count-as-is') {
			const completed = pending.countAsIs();
			await this.#enqueue(() => repository.close(completed));
			this.#show(completed);
			return;
		}
		if (choice === 'keep-out-of-stats') {
			const excluded = pending.keepOutOfStats();
			await this.#enqueue(() => repository.close(excluded));
		} else await this.#enqueue(() => repository.deleteSnapshot(pending.id));
		this.current = null;
	}

	/** → : next group; twice quickly on the last group finishes the memorization (RG09). */
	next(): void {
		const memorizing = this.current;
		if (memorizing?.phase !== 'memorizing') return;
		if (memorizing.navigation.next() === 'finish') this.finishMemorization();
		else this.#syncNavigation(memorizing);
	}

	/** ← : previous group (RG09). */
	previous(): void {
		const memorizing = this.current;
		if (memorizing?.phase !== 'memorizing') return;
		memorizing.navigation.previous();
		this.#syncNavigation(memorizing);
	}

	/** Space or ↑ : back to the first group (RG09). */
	toStart(): void {
		const memorizing = this.current;
		if (memorizing?.phase !== 'memorizing') return;
		memorizing.navigation.toStart();
		this.#syncNavigation(memorizing);
	}

	finishMemorization(): void {
		const memorizing = this.current;
		if (memorizing?.phase !== 'memorizing') return;
		const paused = memorizing.finishMemorization();
		this.#show(paused);
		this.#save(paused);
		this.memorizationMs = paused.memorizationMs;
		this.#schedule(paused.countdown.remainingMs(), () => this.#startRecall());
	}

	type(digit: Digit): void {
		this.#editRecall((recall) => recall.type(digit));
	}

	/** Click or tap on a recall cell (RG10). */
	select(index: number): void {
		this.#editRecall((recall) => recall.select(index));
	}

	/** Arrow keys on the recall grid; the selection stays inside the grid (RG10). */
	moveSelection(delta: number): void {
		const recalling = this.current;
		if (recalling?.phase !== 'recalling') return;
		const last = recalling.items.length - 1;
		recalling.recall.select(Math.min(last, Math.max(0, recalling.recall.selected + delta)));
		this.#syncRecall(recalling);
	}

	/** Backspace: erases the selected cell if filled, otherwise the one on its left (RG10, US08). */
	backspace(): void {
		this.#editRecall((recall) => recall.backspace());
	}

	/** + : inserts a blank cell at the selection (US08 CA2). */
	insert(): void {
		this.#editRecall((recall) => recall.insert());
	}

	/** − : removes the selected cell (US08 CA2). */
	remove(): void {
		this.#editRecall((recall) => recall.remove());
	}

	/** Format of a standard trial, shown on the launch screen (RG01). */
	get standardFormat(): Format {
		return this.deps.discipline.standardFormat();
	}

	/**
	 * Scores the trial, stores it, then shows the result (CU03 step 5): closing the tab once the
	 * result shows never loses the trial (ENF07). A second call while storing waits for the first.
	 */
	finishRecall(): Promise<void> {
		if (this.#closing) return this.#closing;
		const recalling = this.current;
		if (recalling?.phase !== 'recalling') return Promise.resolve();
		this.#cancelPending?.();
		this.#cancelPending = null;
		this.#stopSaving();
		const completed = recalling.finishRecall();
		this.#closing = this.#enqueue(() => this.deps.repository.close(completed))
			.then(() => this.#show(completed))
			.finally(() => (this.#closing = null));
		return this.#closing;
	}

	#startMemorization(): void {
		const paused = this.current;
		if (paused?.phase !== 'paused-before-memorization') return;
		const memorizing = paused.startMemorization();
		this.#show(memorizing);
		// Saved from the start of memorization (decision CU01), then every 2 s.
		this.#save(memorizing);
		this.#startSaving();
		this.#syncNavigation(memorizing);
		this.#stopWhenTimeIsUp(
			() => memorizing.format.memorizationMs - memorizing.elapsedMs(),
			() => this.finishMemorization()
		);
	}

	#startRecall(): void {
		const paused = this.current;
		if (paused?.phase !== 'paused-before-recall') return;
		const recalling = paused.startRecall();
		this.#show(recalling);
		this.#save(recalling);
		this.#syncRecall(recalling);
		this.#stopWhenTimeIsUp(
			() => recalling.format.recallMs - recalling.elapsedMs(),
			() => void this.finishRecall()
		);
	}

	/** Timers can fire a little early: check the monotonic clock and wait again if needed. */
	#stopWhenTimeIsUp(remainingMs: () => number, stop: () => void): void {
		const check = () => {
			const left = remainingMs();
			if (left > 0) this.#schedule(left, check);
			else stop();
		};
		this.#schedule(remainingMs(), check);
	}

	/** A failed save is not worth stopping the trial: the next one, 2 s later, may succeed. */
	#save(trial: OngoingPhase): void {
		const snapshot = trial.snapshot();
		void this.#enqueue(() => this.deps.repository.saveSnapshot(snapshot)).catch(() => {});
	}

	/** Saves whatever ongoing phase the trial is in, every 2 s, until it stops (SEQ02). */
	#startSaving(): void {
		const tick = () => {
			this.saveNow();
			this.#cancelSaves = this.deps.scheduler.after(SAVE_INTERVAL_MS, tick);
		};
		this.#cancelSaves = this.deps.scheduler.after(SAVE_INTERVAL_MS, tick);
	}

	#stopSaving(): void {
		this.#cancelSaves?.();
		this.#cancelSaves = null;
	}

	#enqueue(write: () => Promise<void>): Promise<void> {
		const run = this.#writes.then(write);
		this.#writes = run.catch(() => {});
		return run;
	}

	#show(phase: TrialPhase): void {
		this.#cancelPending?.();
		this.#cancelPending = null;
		this.current = phase;
	}

	#schedule(delayMs: number, task: () => void): void {
		this.#cancelPending = this.deps.scheduler.after(delayMs, task);
	}

	#syncNavigation(memorizing: MemorizingTrial): void {
		this.groupIndex = memorizing.navigation.current;
		this.groupCount = memorizing.navigation.groupCount;
		this.group = memorizing.currentGroup();
	}

	/** Applies a gesture to the recall grid, only during the recall, then refreshes the screen. */
	#editRecall(edit: (recall: SequenceRecall) => void): void {
		const recalling = this.current;
		if (recalling?.phase !== 'recalling') return;
		edit(recalling.recall);
		this.#syncRecall(recalling);
	}

	#syncRecall(recalling: RecallingTrial): void {
		this.answers = recalling.recall.answers();
		this.selected = recalling.recall.selected;
	}
}
