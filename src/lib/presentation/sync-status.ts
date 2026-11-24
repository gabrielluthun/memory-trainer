import type { ConnectionStatus } from '../application/connection-service.svelte';
import type { SyncState } from '../application/sync-service.svelte';
import type { Language } from '../domain/settings/settings';
import { m } from '../paraglide/messages';

export interface SyncStatusInput {
	online: boolean;
	connection: ConnectionStatus;
	state: SyncState;
	lastSyncedAt: Date | null;
	now: Date;
	language: Language;
}

/** Green once synchronised (mock-up 10); amber when the trials wait on the device. */
export interface SyncStatus {
	label: string;
	tone: 'right' | 'waiting' | 'neutral';
	/** Clicking it opens the sign-in screen (CU16). */
	signIn: boolean;
}

/**
 * The status of the header (mock-up 10, CU17), or null when there is nothing to say yet.
 * Offline first, then signing in, then the synchronisation itself.
 */
export function syncStatus(input: SyncStatusInput): SyncStatus | null {
	const locale = { locale: input.language };
	const waiting = (label: string, signIn = false): SyncStatus => ({
		label,
		tone: 'waiting',
		signIn
	});
	if (!input.online) return waiting(m.sync_offline({}, locale));
	if (input.connection === 'signed-out' || input.state === 'needs-sign-in') {
		return waiting(m.status_signed_out({}, locale), true);
	}
	if (input.state === 'running' && !input.lastSyncedAt) {
		return { label: m.sync_running({}, locale), tone: 'neutral', signIn: false };
	}
	if (input.state === 'failed') return waiting(m.sync_pending({}, locale));
	if (!input.lastSyncedAt) return null;
	const minutes = Math.floor((input.now.getTime() - input.lastSyncedAt.getTime()) / 60_000);
	const label =
		minutes < 1
			? m.sync_just_now({}, locale)
			: minutes < 60
				? m.sync_minutes({ minutes }, locale)
				: m.sync_hours({ hours: Math.floor(minutes / 60) }, locale);
	return { label, tone: 'right', signIn: false };
}
