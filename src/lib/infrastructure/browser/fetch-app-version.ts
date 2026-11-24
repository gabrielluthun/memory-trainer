import type { AppVersion } from '../../application/ports';

/** What the adapter needs from `fetch`: replaced in the tests. */
export type Fetcher = (url: string, init: RequestInit) => Promise<Response>;

/**
 * Implements AppVersion (ADR 0023): the version of package.json, set at build time, and the
 * version.json file published with the site. The service worker never keeps it (ADR 0008), and
 * the browser is asked not to either.
 */
export class FetchAppVersion implements AppVersion {
	constructor(
		readonly local: string,
		private readonly fetcher: Fetcher = (url, init) => fetch(url, init)
	) {}

	async published(): Promise<string> {
		const response = await this.fetcher('/version.json', { cache: 'no-store' });
		if (!response.ok) throw new Error(`version.json: HTTP ${response.status}`);
		const body: unknown = await response.json();
		if (typeof body !== 'object' || body === null || !('version' in body)) {
			throw new Error('version.json: no version');
		}
		const { version } = body;
		if (typeof version !== 'string') throw new Error('version.json: no version');
		return version;
	}
}
