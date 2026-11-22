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
export class MemorizingTrial extends Trial {
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
		const memorizationMs = Math.min(this.elapsedMs(), this.format.memorizationMs);
		return new PausedBeforeRecall(this.setup, this.clock, memorizationMs);
	}
}

/** Countdown before recall; the memorization time is frozen (RG25). */
export class PausedBeforeRecall extends Trial {
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
export class RecallingTrial extends Trial {
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
			Math.min(this.elapsedMs(), this.format.recallMs)
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
