import {
	SessionRejected,
	TrialRejected,
	type QueuedTrial,
	type ReceivedTrial,
	type RemoteStore
} from '../../src/lib/application/ports';
import type { Settings } from '../../src/lib/domain/settings/settings';
import type { TrialId } from '../../src/lib/domain/trial/trial';

type Answer = 'inserted' | 'duplicate' | 'refused' | 'session-refused' | 'network-error';

/**
 * Test double for the RemoteStore: records what reaches the server, and answers as told, trial by
 * trial ("inserted" by default).
 */
export class FakeRemoteStore implements RemoteStore {
	readonly sentTrials: TrialId[] = [];
	readonly sentSettings: Settings[] = [];
	readonly answers = new Map<TrialId, Answer>();
	settingsAnswer: 'saved' | 'ignored' | 'network-error' = 'saved';
	/** Calls still running, to check that only one synchronisation runs at a time. */
	inFlight = 0;
	/** What the database holds, received from all the devices (SEQ05). */
	remoteTrials: ReceivedTrial[] = [];
	remoteSettings: Settings | null = null;
	/** The cursor of each page asked for. */
	readonly fetchedAfter: number[] = [];
	failFetches = false;

	async sendTrial(trial: QueuedTrial): Promise<'inserted' | 'duplicate'> {
		this.inFlight++;
		await Promise.resolve();
		this.inFlight--;
		const answer = this.answers.get(trial.id) ?? 'inserted';
		if (answer === 'session-refused') throw new SessionRejected('JWT expired');
		if (answer === 'network-error') throw new TypeError('Failed to fetch');
		this.sentTrials.push(trial.id);
		if (answer === 'refused') throw new TrialRejected(`Trial ${trial.id}: check violation`);
		return answer;
	}

	fetchTrials(after: number, limit: number): Promise<ReceivedTrial[]> {
		if (this.failFetches) return Promise.reject(new TypeError('Failed to fetch'));
		this.fetchedAfter.push(after);
		return Promise.resolve(
			this.remoteTrials.filter((trial) => trial.sequenceNumber > after).slice(0, limit)
		);
	}

	fetchSettings(): Promise<Settings | null> {
		return Promise.resolve(this.remoteSettings);
	}

	sendSettings(settings: Settings): Promise<'saved' | 'ignored'> {
		if (this.settingsAnswer === 'network-error') {
			return Promise.reject(new TypeError('Failed to fetch'));
		}
		this.sentSettings.push(settings);
		return Promise.resolve(this.settingsAnswer);
	}
}
