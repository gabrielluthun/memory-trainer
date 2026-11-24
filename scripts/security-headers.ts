import { createHash } from 'node:crypto';

/**
 * The security headers Cloudflare Pages sends on every response (SE5, sections 1 and 2; ES13),
 * as its `_headers` file. Built after `vite build`: the CSP allows the inline start-up script of
 * SvelteKit by its hash, which changes with each build, and the two public addresses of the build.
 */

export interface HeaderSources {
	/** The page of the app, built by SvelteKit (SPA, ADR 0007). */
	html: string;
	hankoApiUrl: string;
	dataApiUrl: string;
}

/** The hash of each inline script of the page (scripts with a `src` are covered by 'self'). */
function inlineScriptHashes(html: string): string[] {
	const scripts = html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g);
	return [...scripts].map(
		([, body]) => `'sha256-${createHash('sha256').update(body).digest('base64')}'`
	);
}

/** Only the origin: a CSP source with a path would only match that exact path. */
function httpsOrigin(url: string): string {
	const parsed = new URL(url);
	if (parsed.protocol !== 'https:') throw new Error(`An https address is required: ${url}`);
	return parsed.origin;
}

export function securityHeaders({ html, hankoApiUrl, dataApiUrl }: HeaderSources): string {
	const hashes = inlineScriptHashes(html);
	if (hashes.length === 0) {
		throw new Error('No inline start-up script in the page: the app would not start under the CSP');
	}
	const csp = [
		"default-src 'self'",
		`script-src 'self' ${hashes.join(' ')}`,
		// Inline styles allowed (SE5 decision), so that Svelte is used normally.
		"style-src 'self' 'unsafe-inline'",
		"font-src 'self'",
		"img-src 'self' data: blob:",
		// The code can only send data to these two services, even if it were hijacked (MEN06).
		`connect-src 'self' ${httpsOrigin(dataApiUrl)} ${httpsOrigin(hankoApiUrl)}`,
		"worker-src 'self'",
		"manifest-src 'self'",
		"object-src 'none'",
		"base-uri 'self'",
		"form-action 'self'",
		"frame-ancestors 'none'"
	].join('; ');
	const headers = {
		'Strict-Transport-Security': 'max-age=63072000; includeSubDomains',
		'Content-Security-Policy': csp,
		'X-Content-Type-Options': 'nosniff',
		'Referrer-Policy': 'no-referrer',
		'Permissions-Policy':
			'camera=(), microphone=(), geolocation=(), payment=(), usb=(), screen-wake-lock=(self), publickey-credentials-get=(self), publickey-credentials-create=(self)',
		'Cross-Origin-Opener-Policy': 'same-origin'
	};
	const lines = Object.entries(headers).map(([name, value]) => `  ${name}: ${value}`);
	return ['/*', ...lines, ''].join('\n');
}
