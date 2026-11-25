import type { Discipline, DisciplineName, ItemResult } from '../disciplines/discipline';
import type { Digit } from '../disciplines/numbers';
import type { Format } from '../format';
import { SequenceRecall } from '../recall/sequence-recall';
import type { DisplayPattern } from '../navigation/display-pattern';
import { GroupNavigation } from '../navigation/group-navigation';
import { Countdown, Stopwatch, type MonotonicClock } from '../timing/timing';

/**
 * A trial is a state machine (ADR 0013): one class per phase, each offering only the allowed
 * actions, and each transition returning a new object of the next phase.
 * Lot 1: Numbers only, so items and answers are digits.
 */

export type TrialId = string;
export type Mode = 'standard' | 'custom';

/** The two preparation pauses, 0, 5, 10 or 20 s (RG25). */
export interface PreparationPauses {
	readonly beforeMemorizationMs: number;
	readonly beforeRecallMs: number;
}

/** Everything decided when the trial is launched. */
export interface TrialSetup {
	readonly id: TrialId;
	readonly discipline: Discipline<Digit, Digit>;
	readonly mode: Mode;
	readonly format: Format;
	readonly pauses: PreparationPauses;
	/** How each group is shown and split during memorization and recall, from the settings (RG11). */
	readonly displayPattern: DisplayPattern;
	readonly items: Digit[];
	readonly startedAt: Date;
}

/** What every phase shares (RG19, RG21, RG22). */
abstract class Trial {
	protected constructor(
		protected readonly setup: TrialSetup,
		protected readonly clock: MonotonicClock
	) {}

	get id(): TrialId {
		return this.setup.id;
	}
	get discipline(): Discipline<Digit, Digit> {
		return this.setup.discipline;
	}
	get disciplineName(): DisciplineName {
		return this.setup.discipline.name;
	}
	get mode(): Mode {
		return this.setup.mode;
	}
	get format(): Format {
		return this.setup.format;
	}
	get items(): Digit[] {
		return this.setup.items;
	}
	get startedAt(): Date {
		return this.setup.startedAt;
	}
	get displayPattern(): DisplayPattern {
		return this.setup.displayPattern;
	}
}

/** The phases an ongoing trial can be saved, abandoned or interrupted in (RG23, RG24). */
export type OngoingPhase = 'memorizing' | 'paused-before-recall' | 'recalling';

/**
 * A plain value saved on the device while the trial runs: at the start of memorization, every
 * 2 s, at each phase change (SEQ02). After an interruption, the trial is rebuilt from the last one
 * (RG24). The pauses are not part of it: they are never recorded with a trial (RG25).
 */
export interface TrialSnapshot {
	readonly id: TrialId;
	readonly discipline: DisciplineName;
	readonly mode: Mode;
	readonly format: Format;
	readonly displayPattern: DisplayPattern;
	readonly items: Digit[];
	readonly startedAt: Date;
	readonly phase: OngoingPhase;
	readonly answers: (Digit | null)[];
	readonly memorizationMs: number;
	readonly recallMs: number;
}

/**
 * The phases a trial can be abandoned or interrupted in (RG23, RG24). The pause before
 * memorization is not one of them: abandoning there keeps nothing (RG25).
 */
abstract class OngoingTrial extends Trial {
	abstract readonly phase: OngoingPhase;

	/** What the trial is now: the answers and times so far, the timers still running. */
	abstract snapshot(): TrialSnapshot;

	/** Stops the trial for good and waits for the practitioner's choice (CU05). */
	abandon(): PendingDecision {
		const { answers, memorizationMs, recallMs } = this.snapshot();
		return new PendingDecision(
			this.setup,
			this.clock,
			'abandoned',
			this.phase,
			answers,
			memorizationMs,
			recallMs
		);
	}

	protected snapshotWith(
		answers: (Digit | null)[],
		memorizationMs: number,
		recallMs: number
	): TrialSnapshot {
		return {
			id: this.id,
			discipline: this.disciplineName,
			mode: this.mode,
			format: { ...this.format },
			displayPattern: [...this.displayPattern],
			items: [...this.items],
			startedAt: new Date(this.startedAt),
			phase: this.phase,
			answers: [...answers],
			memorizationMs,
			recallMs
		};
	}
}

/** Countdown before memorization; the items stay hidden (RG25). */
export class PausedBeforeMemorization extends Trial {
	readonly phase = 'paused-before-memorization';
	readonly countdown: Countdown;

	private constructor(setup: TrialSetup, clock: MonotonicClock) {
		super(setup, clock);
		this.countdown = Countdown.start(clock, setup.pauses.beforeMemorizationMs);
	}

	static begin(setup: TrialSetup, clock: MonotonicClock): PausedBeforeMemorization {
		return new PausedBeforeMemorization(setup, clock);
	}

	startMemorization(): MemorizingTrial {
		return new MemorizingTrial(this.setup, this.clock, Stopwatch.start(this.clock));
	}
}

/** Memorization, timed on the monotonic clock (RG01, RG08). */
export class MemorizingTrial extends OngoingTrial {
	readonly phase = 'memorizing';
	/** Moves through the groups of items (RG09, RG11). Mutable within the phase, like the recall grid. */
	readonly navigation: GroupNavigation;

	constructor(
		setup: TrialSetup,
		clock: MonotonicClock,
		private readonly stopwatch: Stopwatch
	) {
		super(setup, clock);
		this.navigation = new GroupNavigation(setup.items.length, setup.displayPattern, clock);
	}

	/** The items of the group currently in the frame. */
	currentGroup(): Digit[] {
		const { start, end } = this.navigation.groupBounds(this.navigation.current);
		return this.items.slice(start, end);
	}

	elapsedMs(): number {
		return this.stopwatch.elapsedMs();
	}

	isTimeUp(): boolean {
		return this.elapsedMs() >= this.format.memorizationMs;
	}

	/** Called by the practitioner (Finished, Enter) or by the app when the time is up. */
	finishMemorization(): PausedBeforeRecall {
		return new PausedBeforeRecall(this.setup, this.clock, this.#memorizationMs());
	}

	snapshot(): TrialSnapshot {
		const noAnswers = this.items.map(() => null);
		return this.snapshotWith(noAnswers, this.#memorizationMs(), 0);
	}

	#memorizationMs(): number {
		return Math.min(this.elapsedMs(), this.format.memorizationMs);
	}
}

/** Countdown before recall; the memorization time is frozen (RG25). */
export class PausedBeforeRecall extends OngoingTrial {
	readonly phase = 'paused-before-recall';
	readonly countdown: Countdown;

	constructor(
		setup: TrialSetup,
		clock: MonotonicClock,
		readonly memorizationMs: number
	) {
		super(setup, clock);
		this.countdown = Countdown.start(clock, setup.pauses.beforeRecallMs);
	}

	snapshot(): TrialSnapshot {
		const noAnswers = this.items.map(() => null);
		return this.snapshotWith(noAnswers, this.memorizationMs, 0);
	}

	startRecall(): RecallingTrial {
		return new RecallingTrial(
			this.setup,
			this.clock,
			this.memorizationMs,
			Stopwatch.start(this.clock),
			new SequenceRecall(this.items.length)
		);
	}
}

/** Recall, timed, with the answer grid (RG01, RG10). */
export class RecallingTrial extends OngoingTrial {
	readonly phase = 'recalling';

	constructor(
		setup: TrialSetup,
		clock: MonotonicClock,
		readonly memorizationMs: number,
		private readonly stopwatch: Stopwatch,
		readonly recall: SequenceRecall
	) {
		super(setup, clock);
	}

	elapsedMs(): number {
		return this.stopwatch.elapsedMs();
	}

	isTimeUp(): boolean {
		return this.elapsedMs() >= this.format.recallMs;
	}

	/** Called by the practitioner (Finished) or by the app when the time is up. Scores the trial (RG12). */
	finishRecall(): CompletedTrial {
		const answers = this.recall.answers();
		return new CompletedTrial(
			this.setup,
			this.clock,
			answers,
			this.discipline.score(this.items, answers),
			this.memorizationMs,
			this.#recallMs()
		);
	}

	snapshot(): TrialSnapshot {
		return this.snapshotWith(this.recall.answers(), this.memorizationMs, this.#recallMs());
	}

	#recallMs(): number {
		return Math.min(this.elapsedMs(), this.format.recallMs);
	}
}

/** Why a trial waits for the practitioner's choice: a voluntary abandon (RG23) or an interruption (RG24). */
export type DecisionReason = 'abandoned' | 'interrupted';

/**
 * A stopped trial waiting for one of the three choices of RG23. "Ne pas garder" creates nothing:
 * the application simply drops this object. The timers are stopped: the times are frozen.
 */
export class PendingDecision extends Trial {
	readonly phase = 'pending-decision';

	constructor(
		setup: TrialSetup,
		clock: MonotonicClock,
		readonly reason: DecisionReason,
		/** The phase the trial stopped in, to tell the practitioner (mock-up 09). */
		readonly stoppedIn: OngoingPhase,
		readonly answers: (Digit | null)[],
		readonly memorizationMs: number,
		readonly recallMs: number
	) {
		super(setup, clock);
	}

	/**
	 * A trial interrupted by an outside incident, rebuilt at reopening from its last snapshot
	 * (RG24, CU06). Its times are those of the snapshot: at most 2 s off.
	 */
	static fromSnapshot(
		snapshot: TrialSnapshot,
		discipline: Discipline<Digit, Digit>,
		clock: MonotonicClock
	): PendingDecision {
		if (snapshot.discipline !== discipline.name) {
			throw new Error('An interrupted trial is rebuilt with its own discipline only');
		}
		const setup: TrialSetup = {
			id: snapshot.id,
			discipline,
			mode: snapshot.mode,
			format: snapshot.format,
			// Not saved (RG25), and of no use once the trial has stopped.
			pauses: { beforeMemorizationMs: 0, beforeRecallMs: 0 },
			displayPattern: snapshot.displayPattern,
			items: snapshot.items,
			startedAt: snapshot.startedAt
		};
		return new PendingDecision(
			setup,
			clock,
			'interrupted',
			snapshot.phase,
			snapshot.answers,
			snapshot.memorizationMs,
			snapshot.recallMs
		);
	}

	/** "Compter tel quel": scored with the answers already given, then counted normally (RG12, RG23). */
	countAsIs(): CompletedTrial {
		return new CompletedTrial(
			this.setup,
			this.clock,
			this.answers,
			this.discipline.score(this.items, this.answers),
			this.memorizationMs,
			this.recallMs
		);
	}

	/** "Garder hors statistiques": kept in the history, out of the statistics (RG23, RG24). */
	keepOutOfStats(): ExcludedTrial {
		return new ExcludedTrial(
			this.setup,
			this.clock,
			this.reason === 'abandoned' ? 'abandoned' : 'external_error',
			this.answers,
			this.memorizationMs,
			this.recallMs
		);
	}
}

/** A counted trial. Closed: no method can change it (RG18). */
export class CompletedTrial extends Trial {
	readonly phase = 'completed';
	readonly status = 'completed';
	readonly score: number;

	constructor(
		setup: TrialSetup,
		clock: MonotonicClock,
		readonly answers: (Digit | null)[],
		readonly results: ItemResult<Digit, Digit>[],
		readonly memorizationMs: number,
		readonly recallMs: number
	) {
		super(setup, clock);
		this.score = results.filter((result) => result.correct).length;
	}

	/** The score comes first; at equal score, the shorter memorization wins (RG13). */
	isBetterThan(other: CompletedTrial): boolean {
		if (this.score !== other.score) return this.score > other.score;
		return this.memorizationMs < other.memorizationMs;
	}
}

/**
 * A trial kept out of the statistics: "abandonné", or "Erreur externe à l'application" after an
 * interruption (RG23, RG24). Not scored. Closed: no method can change it (RG18).
 */
export class ExcludedTrial extends Trial {
	readonly phase = 'excluded';

	constructor(
		setup: TrialSetup,
		clock: MonotonicClock,
		readonly status: 'abandoned' | 'external_error',
		readonly answers: (Digit | null)[],
		readonly memorizationMs: number,
		readonly recallMs: number
	) {
		super(setup, clock);
	}
}

/** The only trials stored for good and sent to the database (class diagram). */
export type ClosedTrial = CompletedTrial | ExcludedTrial;
