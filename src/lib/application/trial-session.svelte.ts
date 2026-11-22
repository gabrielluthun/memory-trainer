import type { Digit, NumbersDiscipline } from '../domain/disciplines/numbers';
import type { DisciplineName } from '../domain/disciplines/discipline';
import type { Format } from '../domain/format';
import type { DisplayPattern } from '../domain/navigation/display-pattern';
import type { RandomSource } from '../domain/random';
import type { Settings } from '../domain/settings/settings';
import type { MonotonicClock } from '../domain/timing/timing';
import {
	PausedBeforeMemorization,
	type PreparationPauses,
	type CompletedTrial,
	type MemorizingTrial,
	type PausedBeforeRecall,
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
	PausedBeforeMemorization | MemorizingTrial | PausedBeforeRecall | RecallingTrial | CompletedTrial;

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

	constructor(private readonly deps: TrialSessionDependencies) {}

	/** US01: a standard trial. */
	start(options: { pauses?: PreparationPauses } = {}): void {
		const { discipline, random, ids, wallClock, clock } = this.deps;
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
		this.memorizationMs = paused.memorizationMs;
		this.#schedule(paused.countdown.remainingMs(), () => this.#startRecall());
	}

	type(digit: Digit): void {
		const recalling = this.current;
		if (recalling?.phase !== 'recalling') return;
		recalling.recall.type(digit);
		this.#syncRecall(recalling);
	}

	/** Click or tap on a recall cell (RG10). */
	select(index: number): void {
		const recalling = this.current;
		if (recalling?.phase !== 'recalling') return;
		recalling.recall.select(index);
		this.#syncRecall(recalling);
	}

	/** Arrow keys on the recall grid; the selection stays inside the grid (RG10). */
	moveSelection(delta: number): void {
		const recalling = this.current;
		if (recalling?.phase !== 'recalling') return;
		const last = recalling.items.length - 1;
		recalling.recall.select(Math.min(last, Math.max(0, recalling.recall.selected + delta)));
		this.#syncRecall(recalling);
	}

	/** Format of a standard trial, shown on the launch screen (RG01). */
	get standardFormat(): Format {
		return this.deps.discipline.standardFormat();
	}

	async finishRecall(): Promise<void> {
		const recalling = this.current;
		if (recalling?.phase !== 'recalling') return;
		const completed = recalling.finishRecall();
		this.#show(completed);
		await this.deps.repository.close(completed);
	}

	#startMemorization(): void {
		const paused = this.current;
		if (paused?.phase !== 'paused-before-memorization') return;
		const memorizing = paused.startMemorization();
		this.#show(memorizing);
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

	#syncRecall(recalling: RecallingTrial): void {
		this.answers = recalling.recall.answers();
		this.selected = recalling.recall.selected;
	}
}
