import type { AppVersion } from '../../src/lib/application/ports';

/** Test double for the AppVersion: the version of the device, and what version.json says. */
export class FakeAppVersion implements AppVersion {
	reads = 0;

	/** What version.json says; "unreadable" makes the reading fail, like a network error. */
	constructor(
		public readonly local = '0.1.0',
		public answer: string = local
	) {}

	published(): Promise<string> {
		this.reads++;
		if (this.answer === 'unreadable') return Promise.reject(new Error('version.json unreadable'));
		return Promise.resolve(this.answer);
	}
}
