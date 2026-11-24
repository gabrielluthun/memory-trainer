import type { Digit } from '../domain/disciplines/numbers';
import type { Discipline } from '../domain/disciplines/discipline';
import type { MonotonicClock } from '../domain/timing/timing';
import { PendingDecision, type CompletedTrial } from '../domain/trial/trial';
import type { TrialRepository } from './ports';
import type { AbandonChoice } from './trial-session.svelte';

export interface InterruptedTrialRecoveryDependencies {
	discipline: Discipline<Digit, Digit>;
	clock: MonotonicClock;
	repository: TrialRepository;
}

/**
 * At opening, looks for a trial left ongoing by an outside incident (tab closed, empty battery,
 * crash) and lets the practitioner choose its fate (CU06, RG24). The trial is never sent before
 * that choice: "Ne pas garder" has nothing to delete on the server (ES05).
 */
export class InterruptedTrialRecovery {
	#pending: PendingDecision | null = null;

	constructor(private readonly deps: InterruptedTrialRecoveryDependencies) {}

	/** The interrupted trial waiting for a choice, or null (SEQ01). */
	async check(): Promise<PendingDecision | null> {
		const snapshot = await this.deps.repository.loadSnapshot();
		this.#pending = snapshot
			? PendingDecision.fromSnapshot(snapshot, this.deps.discipline, this.deps.clock)
			: null;
		return this.#pending;
	}

	/**
	 * The three choices of RG23. Returns the counted trial for "Compter tel quel", to show its
	 * result (CU04); null otherwise.
	 */
	async decide(choice: AbandonChoice): Promise<CompletedTrial | null> {
		const pending = this.#pending;
		if (!pending) return null;
		this.#pending = null;
		try {
			return await this.#apply(pending, choice);
		} catch (error) {
			// Nothing was written: the choice is still to be made.
			this.#pending = pending;
			throw error;
		}
	}

	async #apply(pending: PendingDecision, choice: AbandonChoice): Promise<CompletedTrial | null> {
		const { repository } = this.deps;
		if (choice === 'count-as-is') {
			const completed = pending.countAsIs();
			await repository.close(completed);
			return completed;
		}
		if (choice === 'keep-out-of-stats') await repository.close(pending.keepOutOfStats());
		else await repository.deleteSnapshot(pending.id);
		return null;
	}
}
