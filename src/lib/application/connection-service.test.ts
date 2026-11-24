import { describe, expect, it } from 'vitest';
import { FakeAuthSession } from '../../../tests/fakes/fake-auth-session';
import { ConnectionService } from './connection-service.svelte';

const online = { isOnline: () => true };
const offline = { isOnline: () => false };

describe('ConnectionService — at opening (CU16)', () => {
	it('CU16 — online without a session: asks to sign in', async () => {
		const connection = new ConnectionService(new FakeAuthSession('invalid'), online);

		await connection.open();

		expect(connection.status).toBe('signed-out');
		expect(connection.prompting).toBe(true);
	});

	it('CU16 — online with a valid session: nothing to ask', async () => {
		const connection = new ConnectionService(new FakeAuthSession('valid'), online);

		await connection.open();

		expect(connection.status).toBe('signed-in');
		expect(connection.prompting).toBe(false);
	});

	it('CU16 — offline: the app opens with the device data, without asking or calling Hanko', async () => {
		const auth = new FakeAuthSession('invalid');
		const connection = new ConnectionService(auth, offline);

		await connection.open();

		expect(connection.status).toBe('unknown');
		expect(connection.prompting).toBe(false);
		expect(auth.checks).toBe(0);
	});

	it('CU16 — Hanko unreachable: nothing asked, the status stays unknown', async () => {
		const connection = new ConnectionService(new FakeAuthSession('unreachable'), online);

		await connection.open();

		expect(connection.status).toBe('unknown');
		expect(connection.prompting).toBe(false);
	});
});

describe('ConnectionService — during use (CU16)', () => {
	async function openedWithoutSession(auth = new FakeAuthSession('invalid')) {
		const connection = new ConnectionService(auth, online);
		await connection.open();
		return { connection, auth };
	}

	it('CU16 — "Continuer hors connexion" closes the screen until the next opening', async () => {
		const { connection } = await openedWithoutSession();

		connection.dismiss();

		expect(connection.prompting).toBe(false);
		expect(connection.status).toBe('signed-out');
	});

	it('CU16 — the "Non connecté" status opens the screen at any time', async () => {
		const { connection } = await openedWithoutSession();
		connection.dismiss();

		connection.ask();

		expect(connection.prompting).toBe(true);
	});

	it('CU16 — a session created by Hanko closes the screen', async () => {
		const { connection, auth } = await openedWithoutSession();

		auth.emit(true);

		expect(connection.status).toBe('signed-in');
		expect(connection.prompting).toBe(false);
	});

	it('ES03 — a session that expires during use is noted, without interrupting', async () => {
		const { connection, auth } = await openedWithoutSession(new FakeAuthSession('valid'));

		auth.emit(false);

		expect(connection.status).toBe('signed-out');
		expect(connection.prompting).toBe(false);
	});

	it('ES03 — signing out ends the session, without asking to sign in again', async () => {
		const { connection, auth } = await openedWithoutSession(new FakeAuthSession('valid'));

		await connection.signOut();

		expect(auth.signOuts).toBe(1);
		expect(connection.status).toBe('signed-out');
		expect(connection.prompting).toBe(false);
	});
});
