import { describe, expect, it } from 'vitest';
import { InMemorySettingsRepository } from '../../../tests/fakes/in-memory-settings-repository';
import { RecordingInterfaceLanguage } from '../../../tests/fakes/recording-interface-language';
import { Settings } from '../domain/settings/settings';
import { SettingsService } from './settings-service.svelte';

const wallClock = { now: () => new Date('2026-11-22T11:00:00Z') };

describe('SettingsService', () => {
	it('CU15 — uses the default settings on a device that never saved any', async () => {
		const service = new SettingsService(
			new InMemorySettingsRepository(),
			wallClock,
			new RecordingInterfaceLanguage()
		);

		await service.load();

		expect(service.current.groupPatternFor('numbers')).toEqual([2]);
	});

	it('CU15 — loads the settings stored on the device', async () => {
		const stored = Settings.defaults().withGroupPattern(
			'numbers',
			[5],
			new Date('2026-11-01T00:00:00Z')
		);
		const service = new SettingsService(
			new InMemorySettingsRepository(stored),
			wallClock,
			new RecordingInterfaceLanguage()
		);

		await service.load();

		expect(service.current.groupPatternFor('numbers')).toEqual([5]);
	});

	it('US07 CA1bis — a new display pattern is saved, dated by the device', async () => {
		const repository = new InMemorySettingsRepository();
		const service = new SettingsService(repository, wallClock, new RecordingInterfaceLanguage());
		await service.load();

		await service.setGroupPattern('numbers', [2, 3]);

		expect(service.current.groupPatternFor('numbers')).toEqual([2, 3]);
		expect(repository.stored?.groupPatternFor('numbers')).toEqual([2, 3]);
		expect(repository.stored?.modifiedAt).toEqual(new Date('2026-11-22T11:00:00Z'));
	});

	it('US23 CA1 — new pauses are saved, dated by the device', async () => {
		const repository = new InMemorySettingsRepository();
		const service = new SettingsService(repository, wallClock, new RecordingInterfaceLanguage());
		await service.load();

		await service.setPauses('numbers', { beforeMemorizationMs: 5_000, beforeRecallMs: 0 });

		expect(service.current.pausesFor('numbers')).toEqual({
			beforeMemorizationMs: 5_000,
			beforeRecallMs: 0
		});
		expect(repository.stored?.pausesFor('numbers')).toEqual({
			beforeMemorizationMs: 5_000,
			beforeRecallMs: 0
		});
	});

	it('US09 CA4 — the pauses and the launch settings of a trial are saved together', async () => {
		const repository = new InMemorySettingsRepository();
		const service = new SettingsService(repository, wallClock, new RecordingInterfaceLanguage());
		await service.load();
		const launch = { mode: 'custom' as const, custom: { itemCount: 10, memorizationMs: 30_000 } };

		await service.setLaunch('numbers', { beforeMemorizationMs: 5_000, beforeRecallMs: 0 }, launch);

		const standard = { itemCount: 80, memorizationMs: 60_000, recallMs: 240_000 };
		expect(repository.stored?.launchFor('numbers', standard)).toEqual(launch);
		expect(repository.stored?.pausesFor('numbers').beforeMemorizationMs).toBe(5_000);
		expect(service.current.launchFor('numbers', standard)).toEqual(launch);
		expect(repository.saves).toBe(1);
	});
});

describe('SettingsService — interface language (US19)', () => {
	it('ADR 0029 — at loading, the interface takes the language of the stored settings', async () => {
		const stored = Settings.defaults().withLanguage('en', new Date('2026-11-01T00:00:00Z'));
		const language = new RecordingInterfaceLanguage();
		const service = new SettingsService(
			new InMemorySettingsRepository(stored),
			wallClock,
			language
		);

		await service.load();

		expect(language.current).toBe('en');
	});

	it('ADR 0029 — on a device that never saved settings, the interface is in French', async () => {
		const language = new RecordingInterfaceLanguage();
		const service = new SettingsService(new InMemorySettingsRepository(), wallClock, language);

		await service.load();

		expect(language.current).toBe('fr');
	});

	it('US19 CA1 — a new language is saved, dated by the device, then applied to the interface', async () => {
		const repository = new InMemorySettingsRepository();
		const language = new RecordingInterfaceLanguage();
		const service = new SettingsService(repository, wallClock, language);
		await service.load();

		await service.setLanguage('en');

		expect(service.current.interfaceLanguage).toBe('en');
		expect(repository.stored?.interfaceLanguage).toBe('en');
		expect(repository.stored?.modifiedAt).toEqual(new Date('2026-11-22T11:00:00Z'));
		expect(language.current).toBe('en');
	});

	it('US19 CA1 — a language that could not be saved is not applied', async () => {
		const repository = new InMemorySettingsRepository();
		repository.save = () => Promise.reject(new Error('Storage full'));
		const language = new RecordingInterfaceLanguage();
		const service = new SettingsService(repository, wallClock, language);
		await service.load();

		await expect(service.setLanguage('en')).rejects.toThrow('Storage full');

		expect(service.current.interfaceLanguage).toBe('fr');
		expect(language.current).toBe('fr');
	});
});
