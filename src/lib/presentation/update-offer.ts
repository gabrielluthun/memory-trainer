/**
 * A new version is never offered nor installed during a trial (deployment, section 5): from the
 * launch to the choice after an abandon. The result of a finished trial is outside it.
 */

/** A trial runs: any phase but the result. `undefined` when there is no trial. */
function trialRuns(phase: string | undefined): boolean {
	return phase !== undefined && phase !== 'completed';
}

/** The "Nouvelle version disponible" card: home, history, result, settings. */
export function showsUpdateCard(where: { routeId: string | null; phase: string | undefined }) {
	return where.routeId !== '/train/numbers' && !trialRuns(where.phase);
}

/** A version installed here or in another window: the page reloads once no trial runs. */
export function canReload(phase: string | undefined): boolean {
	return !trialRuns(phase);
}
