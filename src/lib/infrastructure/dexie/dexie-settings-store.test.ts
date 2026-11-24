import { afterEach, describe, expect, it } from 'vitest';
import { Settings } from '../../domain/settings/settings';
import { MemoryTrainerDatabase } from './database';
import { DexieSettingsStore } from './dexie-settings-store';

let db: MemoryTrainerDatabase | undefined;

afterEach(async () => {
	await db?.delete();
});

describe('DexieSettingsStore', () => {
	it('CU15 — finds nothing on a device that never saved settings', async () => {
		db = new MemoryTrainerDatabase(`test-${crypto.randomUUID()}`);

		expect(await new DexieSettingsStore(db).load()).toBeNull();
	});

	it('CU15 — gives back the saved settings, without loss', async () => {
		db = new MemoryTrainerDatabase(`test-${crypto.randomUUID()}`);
		const store = new DexieSettingsStore(db);
		const saved = Settings.defaults().withGroupPattern(
			'numbers',
			[2, 3],
			new Date('2026-11-22T11:00:00Z')
		);

		await store.save(saved);
		const loaded = await store.load();

		expect(loaded?.groupPatternFor('numbers')).toEqual([2, 3]);
		expect(loaded?.interfaceLanguage).toBe('fr');
		expect(loaded?.modifiedAt).toEqual(new Date('2026-11-22T11:00:00Z'));
	});

	it('CU15 — keeps a single settings record, the latest saved', async () => {
		db = new MemoryTrainerDatabase(`test-${crypto.randomUUID()}`);
		const store = new DexieSettingsStore(db);
		const at = new Date('2026-11-22T11:00:00Z');

		await store.save(Settings.defaults().withGroupPattern('numbers', [3], at));
		await store.save(Settings.defaults().withGroupPattern('numbers', [4, 3], at));

		expect(await db.settings.count()).toBe(1);
		expect((await store.load())?.groupPatternFor('numbers')).toEqual([4, 3]);
	});

	it('RG25 — gives back the pauses chosen for each discipline', async () => {
		db = new MemoryTrainerDatabase(`test-${crypto.randomUUID()}`);
		const store = new DexieSettingsStore(db);
		const at = new Date('2026-11-22T12:00:00Z');

		await store.save(
			Settings.defaults().withPauses(
				'numbers',
				{ beforeMemorizationMs: 10_000, beforeRecallMs: 5_000 },
				at
			)
		);

		expect((await store.load())?.pausesFor('numbers')).toEqual({
			beforeMemorizationMs: 10_000,
			beforeRecallMs: 5_000
		});
	});

	it('US09 CA4 — gives back the last launch settings of each discipline', async () => {
		db = new MemoryTrainerDatabase(`test-${crypto.randomUUID()}`);
		const store = new DexieSettingsStore(db);
		const launch = { mode: 'custom' as const, custom: { itemCount: 12, memorizationMs: 45_000 } };

		await store.save(
			Settings.defaults().withLaunch('numbers', launch, new Date('2026-11-24T12:00:00Z'))
		);

		const standard = { itemCount: 80, memorizationMs: 60_000, recallMs: 240_000 };
		expect((await store.load())?.launchFor('numbers', standard)).toEqual(launch);
	});

	it('ADR 0027 — settings saved before the display pattern are converted when loaded', async () => {
		db = new MemoryTrainerDatabase(`test-${crypto.randomUUID()}`);
		// A record as US01 and US23 stored it: one group size per discipline.
		await db.settings.put({
			id: 'device',
			interfaceLanguage: 'fr',
			groupSizes: { numbers: 3 },
			modifiedAt: new Date('2026-11-22T12:00:00Z')
		} as never);

		expect((await new DexieSettingsStore(db).load())?.groupPatternFor('numbers')).toEqual([3]);
	});
});

describe('DexieSettingsStore — mark "to send" (SEQ05)', () => {
	const at = new Date('2026-11-24T09:00:00Z');

	it('SEQ05 — settings saved on the device are to send, until sent', async () => {
		db = new MemoryTrainerDatabase(`test-${crypto.randomUUID()}`);
		const store = new DexieSettingsStore(db);
		const saved = Settings.defaults().withLanguage('en', at);

		await store.save(saved);
		expect(await store.isDirty()).toBe(true);

		await store.markSynced(saved.modifiedAt);
		expect(await store.isDirty()).toBe(false);
		expect((await store.load())?.interfaceLanguage).toBe('en');
	});

	it('SEQ05 — a change made while sending stays to send', async () => {
		db = new MemoryTrainerDatabase(`test-${crypto.randomUUID()}`);
		const store = new DexieSettingsStore(db);
		const sent = Settings.defaults().withLanguage('en', at);
		await store.save(sent);

		await store.save(sent.withLanguage('fr', new Date('2026-11-24T09:00:05Z')));
		await store.markSynced(sent.modifiedAt);

		expect(await store.isDirty()).toBe(true);
	});

	it('SEQ05 — settings saved before US21 are to send; no settings, nothing to send', async () => {
		db = new MemoryTrainerDatabase(`test-${crypto.randomUUID()}`);
		const store = new DexieSettingsStore(db);
		expect(await store.isDirty()).toBe(false);

		await db.settings.put({ id: 'device', ...Settings.defaults().withLanguage('en', at).toData() });

		expect(await store.isDirty()).toBe(true);
	});
});

describe('DexieSettingsStore — settings received (ADR 0012)', () => {
	it('ADR 0012 — settings received from the database are stored, not to send back', async () => {
		db = new MemoryTrainerDatabase(`test-${crypto.randomUUID()}`);
		const store = new DexieSettingsStore(db);
		const received = Settings.defaults().withLanguage('en', new Date('2026-11-24T08:00:00Z'));

		await store.saveReceived(received);

		expect((await store.load())?.interfaceLanguage).toBe('en');
		expect(await store.isDirty()).toBe(false);
	});
});
