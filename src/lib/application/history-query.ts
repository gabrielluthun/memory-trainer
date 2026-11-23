import type { DisciplineName } from '../domain/disciplines/discipline';
import type { Mode, TrialId } from '../domain/trial/trial';
import type { TrialDetail, TrialRepository, TrialSummary } from './ports';

/** The filters of the history screen (US12 CA1). */
export interface HistoryFilter {
	discipline: DisciplineName | 'all';
	mode: Mode | 'all';
}

/**
 * Lists and opens the stored trials, read on the device, offline included (CU04, CU07).
 * Read only: nothing here can change or delete a trial (RG18, US12 CA3).
 */
export class HistoryQuery {
	constructor(private readonly repository: TrialRepository) {}

	/** Most recent first, as the repository gives them. */
	async list(filter: HistoryFilter): Promise<TrialSummary[]> {
		const trials = await this.repository.list();
		return trials.filter(
			(trial) =>
				(filter.discipline === 'all' || trial.discipline === filter.discipline) &&
				(filter.mode === 'all' || trial.mode === filter.mode)
		);
	}

	get(id: TrialId): Promise<TrialDetail | null> {
		return this.repository.get(id);
	}
}
