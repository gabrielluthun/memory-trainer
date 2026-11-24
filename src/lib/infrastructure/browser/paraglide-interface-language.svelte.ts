import type { InterfaceLanguage } from '../../application/ports';
import { LANGUAGES, type Language } from '../../domain/settings/settings';
import { defineCustomClientStrategy } from '../../paraglide/runtime';

/** Where the device keeps its copy of the language (ADR 0029). */
export const LANGUAGE_STORAGE_KEY = 'memory-trainer.language';

/** The part of localStorage used here; the browser may refuse it (private browsing). */
export interface LanguageStorage {
	getItem(key: string): string | null;
	setItem(key: string, value: string): void;
}

/** The browser's localStorage, or null when even reaching it is refused. */
export function deviceStorage(): LanguageStorage | null {
	try {
		return localStorage;
	} catch {
		return null;
	}
}

/**
 * The language of the screens, as a rune read by Paraglide on every text (ADR 0029): changing it
 * updates the texts without reloading. Copied in localStorage to open in the right language
 * before the settings are read; the page language follows, for screen readers.
 */
export class ParaglideInterfaceLanguage implements InterfaceLanguage {
	#current = $state<Language>('fr');

	constructor(
		private readonly storage: LanguageStorage | null,
		private readonly root: { lang: string }
	) {
		this.#current = this.readCopy() ?? 'fr';
		this.root.lang = this.#current;
		defineCustomClientStrategy('custom-settings', {
			getLocale: () => this.#current,
			// Paraglide calls it on the first text read, with the language it just got from getLocale,
			// inside a template where no state may change. Only the settings change the language,
			// through apply().
			setLocale: () => {}
		});
	}

	apply(language: Language): void {
		this.#current = language;
		this.root.lang = language;
		try {
			this.storage?.setItem(LANGUAGE_STORAGE_KEY, language);
		} catch {
			// Only a convenience: the settings keep the language.
		}
	}

	private readCopy(): Language | null {
		try {
			const copy = this.storage?.getItem(LANGUAGE_STORAGE_KEY);
			return LANGUAGES.find((language) => language === copy) ?? null;
		} catch {
			return null;
		}
	}
}
