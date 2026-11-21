import Dexie, { type EntityTable } from 'dexie';
import { afterEach, describe, expect, it } from 'vitest';

// Sprint 0 smoke test: Dexie.js runs on the in-memory IndexedDB (fake-indexeddb).
// The real schema (DexieDatabase) arrives with lot 1.

interface Row {
	id: string;
	value: number;
}

const openDatabase = () => {
	const db = new Dexie(`smoke-${crypto.randomUUID()}`) as Dexie & {
		rows: EntityTable<Row, 'id'>;
		queue: EntityTable<Row, 'id'>;
	};
	db.version(1).stores({ rows: 'id', queue: 'id' });
	return db;
};

let db: ReturnType<typeof openDatabase> | undefined;

afterEach(async () => {
	await db?.delete();
});

describe('Dexie.js on fake IndexedDB', () => {
	it('writes and reads a record', async () => {
		db = openDatabase();

		await db.rows.add({ id: 'a', value: 1 });

		expect(await db.rows.get('a')).toEqual({ id: 'a', value: 1 });
	});

	it('rolls back both tables when a transaction fails', async () => {
		db = openDatabase();
		const { rows, queue } = db;

		await expect(
			db.transaction('rw', rows, queue, async () => {
				await rows.add({ id: 'a', value: 1 });
				await queue.add({ id: 'a', value: 1 });
				throw new Error('crash in the middle of closing a trial');
			})
		).rejects.toThrow('crash');

		expect(await rows.count()).toBe(0);
		expect(await queue.count()).toBe(0);
	});
});
