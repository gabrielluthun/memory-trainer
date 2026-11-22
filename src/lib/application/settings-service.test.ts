import { describe, expect, it } from 'vitest';
import { InMemorySettingsRepository } from '../../../tests/fakes/in-memory-settings-repository';
import { Settings } from '../domain/settings/settings';
import { SettingsService } from './settings-service.svelte';

const wallClock = { now: () => new Date('2026-11-22T11:00:00Z') };

describe('SettingsService', () => {
	it('CU15 — uses the default settings on a device that never saved any', async () => {
		const service = new SettingsService(new InMemorySettingsRepository(), wallClock);

		await service.load();

		expect(service.current.groupSizeFor('numbers')).toBe(2);
	});

	it('CU15 — loads the settings stored on the device', async () => {
		const stored = Settings.defaults().withGroupSize(
			'numbers',
			5,
			new Date('2026-11-01T00:00:00Z')
		);
		const service = new SettingsService(new InMemorySettingsRepository(stored), wallClock);

		await service.load();

		expect(service.current.groupSizeFor('numbers')).toBe(5);
	});

	it('US07 CA1bis — a new group size is saved, dated by the device', async () => {
		const repository = new InMemorySettingsRepository();
		const service = new SettingsService(repository, wallClock);
		await service.load();

		await service.setGroupSize('numbers', 3);

		expect(service.current.groupSizeFor('numbers')).toBe(3);
		expect(repository.stored?.groupSizeFor('numbers')).toBe(3);
		expect(repository.stored?.modifiedAt).toEqual(new Date('2026-11-22T11:00:00Z'));
	});
});
