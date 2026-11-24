import { NeonPostgrestClient } from '@neondatabase/postgrest-js';
import {
	SessionRejected,
	TrialRejected,
	type AuthSession,
	type QueuedTrial,
	type RemoteStore
} from '../../application/ports';
import type { Settings } from '../../domain/settings/settings';
import { settingsPayload, type DisciplineDefaults } from './settings-payload';

/** What a database function answers through PostgREST: its value, or an error and a status. */
interface RpcResult {
	data: unknown;
	error: { code?: string; message?: string } | null;
	status: number;
}

/**
 * Errors of the values themselves (PostgreSQL classes 22 and 23, and RAISE in a function), except
 * a missing reference: an unknown account or discipline is not a fault of the trial.
 */
function isRefusedValue(code = ''): boolean {
	return (
		(code.startsWith('22') || code.startsWith('23') || code.startsWith('P0')) && code !== '23503'
	);
}

/**
 * The Data API of Neon (ADR 0031), behind the RemoteStore: the database functions of SEQ05,
 * called with the session token. Only the Authorization header is added: no information about
 * the app or the device leaves it (ES15).
 */
export class DataApiClient implements RemoteStore {
	private readonly client: NeonPostgrestClient;

	constructor(
		url: string,
		private readonly auth: AuthSession,
		private readonly disciplines: DisciplineDefaults[],
		fetchFn: typeof fetch = (input, init) => fetch(input, init)
	) {
		this.client = new NeonPostgrestClient({
			dataApiUrl: url,
			options: {
				global: {
					fetch: (input, init) => {
						const headers = new Headers(init?.headers);
						headers.set('Authorization', `Bearer ${this.auth.token() ?? ''}`);
						return fetchFn(input, { ...init, headers });
					}
				}
			}
		});
	}

	async sendTrial(trial: QueuedTrial): Promise<'inserted' | 'duplicate'> {
		const result = await this.call('submit_trial', { trial: trial.record });
		if (result.error && result.status === 400 && isRefusedValue(result.error.code)) {
			throw new TrialRejected(`Trial ${trial.id} refused: ${result.error.code}`);
		}
		return this.valueOf(result, 'submit_trial') as 'inserted' | 'duplicate';
	}

	async sendSettings(settings: Settings): Promise<'saved' | 'ignored'> {
		const result = await this.call('save_settings', {
			settings: settingsPayload(settings, this.disciplines)
		});
		return this.valueOf(result, 'save_settings') as 'saved' | 'ignored';
	}

	/** No session: nothing is sent, the practitioner signs in first (CU16). */
	private async call(name: string, args: Record<string, unknown>): Promise<RpcResult> {
		if (!this.auth.token()) throw new SessionRejected('No session');
		return (await this.client.rpc(name, args)) as RpcResult;
	}

	/** Refused token or account: sign in again (ES04). Anything else is retried later. */
	private valueOf(result: RpcResult, name: string): unknown {
		if (!result.error) return result.data;
		if (result.status === 401 || result.status === 403) {
			throw new SessionRejected(`${name}: ${result.error.code ?? result.status}`);
		}
		throw new Error(`${name} failed: ${result.status} ${result.error.code ?? ''}`.trim());
	}
}
