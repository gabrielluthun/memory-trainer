import { describe, expect, it, vi } from 'vitest';
import { FakeAuthSession } from '../../../tests/fakes/fake-auth-session';
import { FakeMonotonicClock } from '../../../tests/fakes/fake-monotonic-clock';
import { FakeNetwork } from '../../../tests/fakes/fake-network';
import { FakeRemoteStore } from '../../../tests/fakes/fake-remote-store';
import { FakeScheduler } from '../../../tests/fakes/fake-scheduler';
import { InMemoryOutbox } from '../../../tests/fakes/in-memory-outbox';
import { InMemorySettingsRepository } from '../../../tests/fakes/in-memory-settings-repository';
import { InMemoryTrialRepository } from '../../../tests/fakes/in-memory-trial-repository';
import { Settings } from '../domain/settings/settings';
import type { ReceivedTrial } from './ports';
import { SYNC_INTERVAL_MS, SyncService } from './sync-service.svelte';

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
	const trials = new InMemoryTrialRepository();
	const network = new FakeNetwork(online);
	const scheduler = new FakeScheduler(new FakeMonotonicClock());
	const adopted: Settings[] = [];
	const sync = new SyncService({
		outbox,
		trials,
		settings: settingsRepository,
		remote,
		auth,
		network,
		scheduler,
		wallClock: { now: () => now },
		onSettingsReceived: (received) => adopted.push(received)
	});
	return { sync, outbox, remote, auth, settingsRepository, trials, network, scheduler, adopted };
}

/** A trial of another device, as the database numbers it (ADR 0011). */
const received = (sequenceNumber: number): ReceivedTrial => ({
	id: `remote-${sequenceNumber}`,
	sequenceNumber,
	record: { trial_id: `remote-${sequenceNumber}` }
});

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

describe('SyncService — receiving the other devices trials (CU17, SEQ05)', () => {
	it('US21 CA1 — trials made on the other devices are added, and the cursor moves on', async () => {
		const { sync, remote, trials } = setup({ queue: [] });
		remote.remoteTrials = [received(1), received(2)];

		await sync.sync();

		expect([...trials.received.keys()]).toEqual(['remote-1', 'remote-2']);
		expect(trials.cursor).toBe(2);
	});

	it('ADR 0011 — only the trials after the cursor are asked for', async () => {
		const { sync, remote, trials } = setup({ queue: [] });
		trials.cursor = 7;
		remote.remoteTrials = [received(6), received(7), received(8)];

		await sync.sync();

		expect(remote.fetchedAfter).toEqual([7]);
		expect([...trials.received.keys()]).toEqual(['remote-8']);
	});

	it('SEQ05 — pages of 50: a full page asks for the next one, a short page ends', async () => {
		const { sync, remote, trials } = setup({ queue: [] });
		remote.remoteTrials = Array.from({ length: 120 }, (_, index) => received(index + 1));

		await sync.sync();

		expect(remote.fetchedAfter).toEqual([0, 50, 100]);
		expect(trials.received.size).toBe(120);
		expect(trials.cursor).toBe(120);
	});

	it('SEQ05 — this device sends before it receives: its own trials come back, already known', async () => {
		const { sync, remote, outbox } = setup({ queue: ['trial-a'] });

		await sync.sync();

		expect(remote.sentTrials).toEqual(['trial-a']);
		expect(outbox.ids).toEqual([]);
		expect(remote.fetchedAfter).toEqual([0]);
	});

	it('CU17 1a — a reception cut short keeps the cursor where it was', async () => {
		const { sync, remote, trials } = setup({ queue: [] });
		remote.failFetches = true;

		await sync.sync();

		expect(trials.cursor).toBe(0);
		expect(sync.state).toBe('failed');
	});
});

describe('SyncService — receiving the settings (ADR 0012)', () => {
	const local = Settings.defaults().withLanguage('fr', new Date('2026-11-23T09:00:00Z'));

	it('ADR 0012 — more recent settings from another device replace the ones of this device', async () => {
		const { sync, remote, settingsRepository, adopted } = setup({ queue: [], settings: local });
		settingsRepository.dirty = false;
		const newer = Settings.defaults().withLanguage('en', new Date('2026-11-24T08:00:00Z'));
		remote.remoteSettings = newer;

		await sync.sync();

		expect(settingsRepository.stored).toBe(newer);
		expect(settingsRepository.dirty).toBe(false);
		expect(adopted).toEqual([newer]);
	});

	it('ADR 0012 — older or equal settings from the database change nothing', async () => {
		const { sync, remote, settingsRepository, adopted } = setup({ queue: [], settings: local });
		remote.remoteSettings = Settings.defaults().withLanguage(
			'en',
			new Date('2026-11-22T08:00:00Z')
		);

		await sync.sync();

		expect(settingsRepository.stored).toBe(local);
		expect(adopted).toEqual([]);
	});

	it('ADR 0012 — a new device takes the settings of the database', async () => {
		const { sync, remote, settingsRepository } = setup({ queue: [] });
		const fromDatabase = Settings.defaults().withLanguage('en', new Date('2026-11-24T08:00:00Z'));
		remote.remoteSettings = fromDatabase;

		await sync.sync();

		expect(settingsRepository.stored).toBe(fromDatabase);
	});
});

describe('SyncService — triggers (CU17)', () => {
	it('CU17 — the return of the network starts a synchronisation', async () => {
		const { sync, network, remote } = setup({ online: false });
		sync.startTriggers();

		network.comeBack();

		await vi.waitFor(() => expect(remote.sentTrials).toHaveLength(3));
	});

	it('CU17 — every 5 minutes while the app is open', async () => {
		const { sync, scheduler, remote } = setup({ queue: [] });
		sync.startTriggers();

		scheduler.advance(SYNC_INTERVAL_MS);
		await vi.waitFor(() => expect(remote.fetchedAfter).toHaveLength(1));
		scheduler.advance(SYNC_INTERVAL_MS);
		await vi.waitFor(() => expect(remote.fetchedAfter).toHaveLength(2));
	});

	it('CU17 — stopping the triggers stops them all', async () => {
		const { sync, scheduler, network, remote } = setup({ queue: [] });
		const stop = sync.startTriggers();

		stop();
		scheduler.advance(SYNC_INTERVAL_MS);
		network.comeBack();
		await Promise.resolve();

		expect(remote.fetchedAfter).toEqual([]);
		expect(scheduler.pendingCount).toBe(0);
	});
});
