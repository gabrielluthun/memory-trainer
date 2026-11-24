import type { Outbox, QueuedTrial } from '../../src/lib/application/ports';
import type { TrialId } from '../../src/lib/domain/trial/trial';

/** Test double for the Outbox: the queue in order, oldest first, and the trials marked refused. */
export class InMemoryOutbox implements Outbox {
	readonly rejected: TrialId[] = [];

	constructor(public queue: QueuedTrial[] = []) {}

	/** A queued trial, its record reduced to what the tests check. */
	static trial(id: TrialId): QueuedTrial {
		return { id, record: { trial_id: id } };
	}

	pending(): Promise<QueuedTrial[]> {
		return Promise.resolve([...this.queue]);
	}

	remove(id: TrialId): Promise<void> {
		this.queue = this.queue.filter((trial) => trial.id !== id);
		return Promise.resolve();
	}

	markRejected(id: TrialId): Promise<void> {
		this.rejected.push(id);
		return this.remove(id);
	}

	get ids(): TrialId[] {
		return this.queue.map((trial) => trial.id);
	}
}
