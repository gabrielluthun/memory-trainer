import { describe, expect, it } from 'vitest';
import { FetchAppVersion } from './fetch-app-version';

/** A fetch that answers version.json, and remembers how it was asked. */
function serving(response: () => Response) {
	const requests: { url: string; init?: RequestInit }[] = [];
	const fetcher = (url: string, init?: RequestInit) => {
		requests.push({ url, init });
		return Promise.resolve(response());
	};
	return { fetcher, requests };
}

describe('FetchAppVersion — version of the device and of the published site (ADR 0023)', () => {
	it('keeps the version of the build as the one of this device', () => {
		const { fetcher } = serving(() => Response.json({ version: '0.1.0' }));

		expect(new FetchAppVersion('0.1.0', fetcher).local).toBe('0.1.0');
	});

	it('reads version.json of the site, bypassing every cache', async () => {
		const { fetcher, requests } = serving(() => Response.json({ version: '0.2.0' }));

		expect(await new FetchAppVersion('0.1.0', fetcher).published()).toBe('0.2.0');
		expect(requests).toEqual([{ url: '/version.json', init: { cache: 'no-store' } }]);
	});

	it('a missing file is unreadable: the synchronisation waits', async () => {
		const { fetcher } = serving(() => new Response('Not found', { status: 404 }));

		await expect(new FetchAppVersion('0.1.0', fetcher).published()).rejects.toThrow();
	});

	it('a file without a version (the app page served instead) is unreadable', async () => {
		const { fetcher } = serving(() => new Response('<!doctype html>', { status: 200 }));

		await expect(new FetchAppVersion('0.1.0', fetcher).published()).rejects.toThrow();
	});
});
