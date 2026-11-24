import { describe, expect, it } from 'vitest';
import { getLocale, setLocale } from '../../paraglide/runtime';
import { settings_title } from '../../paraglide/messages';
import {
	LANGUAGE_STORAGE_KEY,
	ParaglideInterfaceLanguage
} from './paraglide-interface-language.svelte';

/** An in-memory stand-in for localStorage. */
function memoryStorage(initial: Record<string, string> = {}) {
	const values = new Map(Object.entries(initial));
	return {
		getItem: (key: string) => values.get(key) ?? null,
		setItem: (key: string, value: string) => void values.set(key, value)
	};
}

const brokenStorage = {
	getItem: (): string | null => {
		throw new Error('Storage access denied');
	},
	setItem: () => {
		throw new Error('Storage access denied');
	}
};

describe('ParaglideInterfaceLanguage', () => {
	it('ADR 0029 — opens in the language copied on the device', () => {
		const root = { lang: 'fr' };

		new ParaglideInterfaceLanguage(memoryStorage({ [LANGUAGE_STORAGE_KEY]: 'en' }), root);

		expect(getLocale()).toBe('en');
		expect(settings_title()).toBe('Settings');
		expect(root.lang).toBe('en');
	});

	it('EF20 — opens in French without a copy, or with an unknown one', () => {
		new ParaglideInterfaceLanguage(memoryStorage(), { lang: '' });
		expect(getLocale()).toBe('fr');

		new ParaglideInterfaceLanguage(memoryStorage({ [LANGUAGE_STORAGE_KEY]: 'de' }), { lang: '' });
		expect(getLocale()).toBe('fr');
	});

	it('US19 CA1 — a language applied changes the texts, the copy and the page language', () => {
		const storage = memoryStorage();
		const root = { lang: 'fr' };
		const language = new ParaglideInterfaceLanguage(storage, root);

		language.apply('en');

		expect(settings_title()).toBe('Settings');
		expect(storage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en');
		expect(root.lang).toBe('en');
	});

	it('ADR 0029 — Paraglide changes nothing by itself: it sets the language while a screen renders', () => {
		const storage = memoryStorage();
		new ParaglideInterfaceLanguage(storage, { lang: 'fr' });

		// Paraglide calls it on the first text read, inside a template, where no state may change.
		void setLocale('en', { reload: false });

		expect(getLocale()).toBe('fr');
		expect(storage.getItem(LANGUAGE_STORAGE_KEY)).toBeNull();
	});

	it('ADR 0029 — still works when the browser refuses local storage', () => {
		const language = new ParaglideInterfaceLanguage(brokenStorage, { lang: 'fr' });

		language.apply('en');

		expect(getLocale()).toBe('en');
	});
});
