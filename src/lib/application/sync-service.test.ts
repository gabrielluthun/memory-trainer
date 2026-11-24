import { describe, expect, it, vi } from 'vitest';
import { FakeAuthSession } from '../../../tests/fakes/fake-auth-session';
import { FakeRemoteStore } from '../../../tests/fakes/fake-remote-store';
import { InMemoryOutbox } from '../../../tests/fakes/in-memory-outbox';
import { InMemorySettingsRepository } from '../../../tests/fakes/in-memory-settings-repository';
import { Settings } from '../domain/settings/settings';
import { SyncService } from './sync-service.svelte';

const now = new Date('2026-11-24T10:00:00Z');

interface Setup {
	queue?: string[];
	session?: 'valid' | 'invalid';
	online?: boolean;
	settings?: Settings | null;
}

function setup({
	queue = ['trial-a', 'trial-b', 'trial-c'],
	session = 'valid',
	online = true,
	settings = null
}: Setup = {}) {
	const outbox = new InMemoryOutbox(queue.map((id) => InMemoryOutbox.trial(id)));
	const remote = new FakeRemoteStore();
	const auth = new FakeAuthSession(session);
	const settingsRepository = new InMemorySettingsRepository(settings);
	const sync = new SyncService({
		outbox,
		settings: settingsRepository,
		remote,
		auth,
		network: { isOnline: () => online },
		wallClock: { now: () => now }
	});
	return { sync, outbox, remote, auth, settingsRepository };
}

describe('SyncService — sending the queue (CU17, SEQ05)', () => {
	it('CU17 — sends each queued trial, oldest first, and empties the queue', async () => {
		const { sync, outbox, remote } = setup();

		await sync.sync();

		expect(remote.sentTrials).toEqual(['trial-a', 'trial-b', 'trial-c']);
		expect(outbox.ids).toEqual([]);
		expect(sync.state).toBe('done');
		expect(sync.lastSyncedAt).toEqual(now);
	});

	it('RG22 — a trial the database already has leaves the queue too, without a duplicate', async () => {
		const { sync, outbox, remote } = setup();
		remote.answers.set('trial-b', 'duplicate');

		await sync.sync();

		expect(outbox.ids).toEqual([]);
	});

	it('ES07 — a refused trial is marked, and the queue goes on with the next ones', async () => {
		const { sync, outbox, remote } = setup();
		remote.answers.set('trial-b', 'refused');

		await sync.sync();

		expect(outbox.rejected).toEqual(['trial-b']);
		expect(remote.sentTrials).toEqual(['trial-a', 'trial-b', 'trial-c']);
		expect(outbox.ids).toEqual([]);
		expect(sync.state).toBe('done');
	});

	it('CU17 1a — network lost on the way: the unconfirmed trials stay queued', async () => {
		const { sync, outbox, remote } = setup();
		remote.answers.set('trial-b', 'network-error');

		await sync.sync();

		expect(outbox.ids).toEqual(['trial-b', 'trial-c']);
		expect(sync.state).toBe('failed');
		expect(sync.lastSyncedAt).toBeNull();
	});

	it('SEQ05 — token refused: the trials wait, and the practitioner is to sign in again', async () => {
		const { sync, outbox, remote } = setup();
		remote.answers.set('trial-a', 'session-refused');

		await sync.sync();

		expect(outbox.ids).toEqual(['trial-a', 'trial-b', 'trial-c']);
		expect(sync.state).toBe('needs-sign-in');
	});

	it('CU17 — not signed in: nothing is sent', async () => {
		const { sync, outbox, remote } = setup({ session: 'invalid' });

		await sync.sync();

		expect(remote.sentTrials).toEqual([]);
		expect(outbox.ids).toHaveLength(3);
		expect(sync.state).toBe('needs-sign-in');
	});

	it('ENF02 — offline: nothing is tried, the state does not change', async () => {
		const { sync, remote } = setup({ online: false });

		await sync.sync();

		expect(remote.sentTrials).toEqual([]);
		expect(sync.state).toBe('idle');
	});

	it('SEQ05 — one synchronisation at a time: a second trigger joins the running one', async () => {
		const { sync, remote } = setup();

		await Promise.all([sync.sync(), sync.sync()]);

		expect(remote.sentTrials).toEqual(['trial-a', 'trial-b', 'trial-c']);
	});

	it('CU16 — a session created by Hanko starts a synchronisation', async () => {
		const { auth, remote } = setup({ session: 'invalid' });

		auth.emit(true);

		await vi.waitFor(() => expect(remote.sentTrials).toEqual(['trial-a', 'trial-b', 'trial-c']));
	});
});

describe('SyncService — sending the settings (ADR 0012)', () => {
	const changed = Settings.defaults().withLanguage('en', new Date('2026-11-23T09:00:00Z'));

	it('SEQ05 — settings changed on this device are sent once, then unmarked', async () => {
		const { sync, remote, settingsRepository } = setup({ queue: [], settings: changed });

		await sync.sync();
		await sync.sync();

		expect(remote.sentSettings).toEqual([changed]);
		expect(settingsRepository.dirty).toBe(false);
	});

	it('ADR 0012 — settings the database ignores (older) are unmarked as well', async () => {
		const { sync, remote, settingsRepository } = setup({ queue: [], settings: changed });
		remote.settingsAnswer = 'ignored';

		await sync.sync();

		expect(settingsRepository.dirty).toBe(false);
	});

	it('SEQ05 — settings not sent stay marked, and are sent next time', async () => {
		const { sync, remote, settingsRepository } = setup({ queue: [], settings: changed });
		remote.settingsAnswer = 'network-error';

		await sync.sync();

		expect(settingsRepository.dirty).toBe(true);
		expect(sync.state).toBe('failed');
	});

	it('SEQ05 — a device that never changed its settings sends none', async () => {
		const { sync, remote } = setup({ queue: [] });

		await sync.sync();

		expect(remote.sentSettings).toEqual([]);
	});
});
