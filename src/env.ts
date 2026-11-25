import { defineEnvVars } from '@sveltejs/kit/env';

/** An https address, required at build time: a build without it fails instead of shipping a broken app. */
function httpsUrl(value: string | undefined): string {
	if (!value || new URL(value).protocol !== 'https:') {
		throw new Error('An https address is required (see .env.example)');
	}
	return value;
}

/**
 * Public configuration of the front, inlined at build time (static site, ADR 0007). Only public
 * addresses: no secret ever reaches the browser (ES08).
 */
export const variables = defineEnvVars({
	PUBLIC_HANKO_API_URL: {
		public: true,
		static: true,
		schema: httpsUrl,
		description: 'API address of the Hanko project (ADR 0030)'
	},
	PUBLIC_DATA_API_URL: {
		public: true,
		static: true,
		schema: httpsUrl,
		description: 'Neon Data API address, ending in /rest/v1 (ADR 0031)'
	}
});
