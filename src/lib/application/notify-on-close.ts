import type { TrialRepository } from './ports';

/**
 * The trial repository, telling once a trial is closed and stored: the end of a trial triggers
 * the synchronisation (CU17). Every way of closing a trial goes through `close()` (CU03, CU05,
 * CU06), so the use cases stay unaware of it.
 */
export function notifyOnClose(repository: TrialRepository, onClosed: () => void): TrialRepository {
	return {
		saveSnapshot: (snapshot) => repository.saveSnapshot(snapshot),
		loadSnapshot: () => repository.loadSnapshot(),
		deleteSnapshot: (id) => repository.deleteSnapshot(id),
		close: async (trial) => {
			await repository.close(trial);
			onClosed();
		},
		list: () => repository.list(),
		get: (id) => repository.get(id),
		addReceived: (trials, cursor) => repository.addReceived(trials, cursor),
		readCursor: () => repository.readCursor()
	};
}
