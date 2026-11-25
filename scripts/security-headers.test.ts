import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { securityHeaders } from './security-headers';

// SE5 (front security), sections 1 and 2; ES13. The headers Cloudflare Pages sends on every response.

const bootstrap = '\n\t{ __sveltekit_x = { base: "" }; }\n';
const html = `<!doctype html><html><head><script type="module" src="/_app/start.js"></script></head>
<body><div style="display: contents"><script>${bootstrap}</script></div></body></html>`;
const urls = {
	hankoApiUrl: 'https://abc123.hanko.io',
	dataApiUrl: 'https://ep-calm-sea.apirest.eu-central-1.aws.neon.tech/neondb/rest/v1'
};

/** The value of one header in the _headers file. */
function header(file: string, name: string): string {
	const line = file.split('\n').find((text) => text.trimStart().startsWith(`${name}:`));
	return line?.slice(line.indexOf(':') + 1).trim() ?? '';
}

/** One directive of the CSP, as its list of sources. */
function directive(file: string, name: string): string[] {
	const found = header(file, 'Content-Security-Policy')
		.split(';')
		.map((part) => part.trim().split(/\s+/))
		.find(([key]) => key === name);
	return found?.slice(1) ?? [];
}

describe('securityHeaders — the _headers file of Cloudflare Pages (SE5)', () => {
	it('applies to every address of the site', () => {
		expect(securityHeaders({ html, ...urls }).startsWith('/*\n')).toBe(true);
	});

	it('SE5 section 1 — HTTPS for 2 years, no sniffing, no referrer, opener isolated', () => {
		const file = securityHeaders({ html, ...urls });

		expect(header(file, 'Strict-Transport-Security')).toBe('max-age=63072000; includeSubDomains');
		expect(header(file, 'X-Content-Type-Options')).toBe('nosniff');
		expect(header(file, 'Referrer-Policy')).toBe('no-referrer');
		expect(header(file, 'Cross-Origin-Opener-Policy')).toBe('same-origin');
	});

	it('SE5 section 1 — only the screen wake lock and the passkeys are permitted', () => {
		expect(header(securityHeaders({ html, ...urls }), 'Permissions-Policy')).toBe(
			'camera=(), microphone=(), geolocation=(), payment=(), usb=(), screen-wake-lock=(self), publickey-credentials-get=(self), publickey-credentials-create=(self)'
		);
	});

	it('SE5 section 2 — scripts of the app, plus the hash of the inline start-up script', () => {
		const hash = createHash('sha256').update(bootstrap).digest('base64');

		expect(directive(securityHeaders({ html, ...urls }), 'script-src')).toEqual([
			"'self'",
			`'sha256-${hash}'`
		]);
	});

	it('SE5 section 2 — data only sent to the app, the Data API and Hanko, by their origins', () => {
		expect(directive(securityHeaders({ html, ...urls }), 'connect-src')).toEqual([
			"'self'",
			'https://ep-calm-sea.apirest.eu-central-1.aws.neon.tech',
			'https://abc123.hanko.io'
		]);
	});

	it('SE5 section 2 — everything else limited to the app, nothing framed, no plugin', () => {
		const file = securityHeaders({ html, ...urls });

		expect(directive(file, 'default-src')).toEqual(["'self'"]);
		expect(directive(file, 'style-src')).toEqual(["'self'", "'unsafe-inline'"]);
		expect(directive(file, 'font-src')).toEqual(["'self'"]);
		expect(directive(file, 'img-src')).toEqual(["'self'", 'data:', 'blob:']);
		expect(directive(file, 'worker-src')).toEqual(["'self'"]);
		expect(directive(file, 'manifest-src')).toEqual(["'self'"]);
		expect(directive(file, 'object-src')).toEqual(["'none'"]);
		expect(directive(file, 'base-uri')).toEqual(["'self'"]);
		expect(directive(file, 'form-action')).toEqual(["'self'"]);
		expect(directive(file, 'frame-ancestors')).toEqual(["'none'"]);
	});

	it('a page without its start-up script is refused: the app would not start under the CSP', () => {
		expect(() => securityHeaders({ html: '<html></html>', ...urls })).toThrow();
	});

	it('an address that is not https is refused', () => {
		expect(() =>
			securityHeaders({ html, ...urls, dataApiUrl: 'http://ep-calm-sea.neon.tech/rest/v1' })
		).toThrow();
	});
});
