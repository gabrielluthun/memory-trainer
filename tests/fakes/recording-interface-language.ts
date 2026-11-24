import type { InterfaceLanguage } from '../../src/lib/application/ports';
import type { Language } from '../../src/lib/domain/settings/settings';

/** Test double for the InterfaceLanguage: records every language applied to the screens. */
export class RecordingInterfaceLanguage implements InterfaceLanguage {
	applied: Language[] = [];

	apply(language: Language): void {
		this.applied.push(language);
	}

	get current(): Language | undefined {
		return this.applied.at(-1);
	}
}
