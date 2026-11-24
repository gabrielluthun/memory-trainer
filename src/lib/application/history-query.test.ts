import { describe, expect, it } from 'vitest';
import { HistoryQuery } from './history-query';
import type { TrialDetail, TrialRepository, TrialSummary } from './ports';

const summary = (id: string, mode: 'standard' | 'custom'): TrialSummary => ({
	id,
	discipline: 'numbers',
	mode,
	status: 'completed',
	startedAt: new Date('2026-11-22T10:00:00Z'),
	itemCount: 80,
	score: 70,
	memorizationMs: 50_000
});

/** A repository already holding these trials, most recent first. */
const repositoryWith = (...trials: TrialSummary[]): TrialRepository => ({
	saveSnapshot: () => Promise.resolve(),
	loadSnapshot: () => Promise.resolve(null),
	deleteSnapshot: () => Promise.resolve(),
	close: () => Promise.resolve(),
	list: () => Promise.resolve(trials),
	get: (id) =>
		Promise.resolve(
			trials.some((trial) => trial.id === id)
				? ({ ...trials.find((trial) => trial.id === id), recallMs: 1, results: [] } as TrialDetail)
				: null
		)
});

describe('HistoryQuery — US12', () => {
	it('US12 CA1 — lists every trial, in the order of the repository (most recent first)', async () => {
		const history = new HistoryQuery(
			repositoryWith(summary('c', 'standard'), summary('b', 'custom'), summary('a', 'standard'))
		);

		const trials = await history.list({ discipline: 'all', mode: 'all' });

		expect(trials.map((trial) => trial.id)).toEqual(['c', 'b', 'a']);
	});

	it('US12 CA1 — filters by mode', async () => {
		const history = new HistoryQuery(
			repositoryWith(summary('c', 'standard'), summary('b', 'custom'), summary('a', 'standard'))
		);

		const custom = await history.list({ discipline: 'all', mode: 'custom' });

		expect(custom.map((trial) => trial.id)).toEqual(['b']);
	});

	it('US12 CA1 — filters by discipline', async () => {
		const history = new HistoryQuery(repositoryWith(summary('a', 'standard')));

		expect(await history.list({ discipline: 'numbers', mode: 'all' })).toHaveLength(1);
	});

	it('US12 CA2 — opens the detail of a trial', async () => {
		const history = new HistoryQuery(repositoryWith(summary('a', 'standard')));

		expect((await history.get('a'))?.id).toBe('a');
		expect(await history.get('unknown')).toBeNull();
	});
});
