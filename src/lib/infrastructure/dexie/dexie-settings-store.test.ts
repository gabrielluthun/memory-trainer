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
