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
		const saved = Settings.defaults().withGroupSize('numbers', 6, new Date('2026-11-22T11:00:00Z'));

		await store.save(saved);
		const loaded = await store.load();

		expect(loaded?.groupSizeFor('numbers')).toBe(6);
		expect(loaded?.interfaceLanguage).toBe('fr');
		expect(loaded?.modifiedAt).toEqual(new Date('2026-11-22T11:00:00Z'));
	});

	it('CU15 — keeps a single settings record, the latest saved', async () => {
		db = new MemoryTrainerDatabase(`test-${crypto.randomUUID()}`);
		const store = new DexieSettingsStore(db);
		const at = new Date('2026-11-22T11:00:00Z');

		await store.save(Settings.defaults().withGroupSize('numbers', 3, at));
		await store.save(Settings.defaults().withGroupSize('numbers', 7, at));

		expect(await db.settings.count()).toBe(1);
		expect((await store.load())?.groupSizeFor('numbers')).toBe(7);
	});
});
