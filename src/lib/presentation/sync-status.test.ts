import { describe, expect, it } from 'vitest';
import { syncStatus } from './sync-status';

const now = new Date('2026-11-24T10:00:00Z');
const base = {
	online: true,
	connection: 'signed-in' as const,
	state: 'done' as const,
	lastSyncedAt: now,
	now,
	language: 'fr' as const
};

describe('syncStatus — the status of the header (mock-up 10, CU17)', () => {
	it('mock-up 10 — synchronised: how long ago, in green', () => {
		expect(syncStatus(base)).toEqual({
			label: 'Synchronisé à l’instant',
			tone: 'right',
			signIn: false
		});
		expect(syncStatus({ ...base, now: new Date('2026-11-24T10:02:30Z') })?.label).toBe(
			'Synchronisé il y a 2 min'
		);
		expect(syncStatus({ ...base, now: new Date('2026-11-24T13:10:00Z') })?.label).toBe(
			'Synchronisé il y a 3 h'
		);
	});

	it('ENF02 — offline comes first: the trials wait on the device', () => {
		expect(syncStatus({ ...base, online: false })).toMatchObject({
			label: 'Hors connexion',
			tone: 'waiting'
		});
	});

	it('CU16 — not signed in, or token refused: a status that opens the sign-in screen', () => {
		expect(syncStatus({ ...base, connection: 'signed-out' })).toEqual({
			label: 'Non connecté',
			tone: 'waiting',
			signIn: true
		});
		expect(syncStatus({ ...base, state: 'needs-sign-in' })?.signIn).toBe(true);
	});

	it('CU17 — running, then failed: said as it is', () => {
		expect(syncStatus({ ...base, state: 'running', lastSyncedAt: null })?.label).toBe(
			'Synchronisation…'
		);
		// Every 5 minutes: the header keeps the last time instead of blinking.
		expect(syncStatus({ ...base, state: 'running' })?.label).toBe('Synchronisé à l’instant');
		expect(syncStatus({ ...base, state: 'failed' })).toMatchObject({
			label: 'Synchronisation en attente',
			tone: 'waiting'
		});
	});

	it('nothing to say before the first synchronisation, or while the session is unknown', () => {
		expect(syncStatus({ ...base, state: 'idle', lastSyncedAt: null })).toBeNull();
		expect(
			syncStatus({ ...base, connection: 'unknown', state: 'idle', lastSyncedAt: null })
		).toBeNull();
	});

	it('US19 — in English', () => {
		expect(
			syncStatus({ ...base, language: 'en', now: new Date('2026-11-24T10:05:00Z') })?.label
		).toBe('Synchronised 5 min ago');
	});
});
