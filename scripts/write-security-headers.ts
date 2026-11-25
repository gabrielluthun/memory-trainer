import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { securityHeaders } from './security-headers.ts';

/**
 * Run after `vite build` (package.json): writes build/_headers for Cloudflare Pages (SE5, ES13).
 * Same addresses as the build: the environment first (CI, Playwright), then the .env file.
 */
const fromFile = existsSync('.env') ? parseEnv(readFileSync('.env', 'utf8')) : {};
const variable = (name: string): string => {
	const value = process.env[name] ?? fromFile[name];
	if (!value) throw new Error(`${name} is required to write the security headers`);
	return value;
};

writeFileSync(
	'build/_headers',
	securityHeaders({
		html: readFileSync('build/index.html', 'utf8'),
		hankoApiUrl: variable('PUBLIC_HANKO_API_URL'),
		dataApiUrl: variable('PUBLIC_DATA_API_URL')
	})
);
console.log('Security headers written to build/_headers');
