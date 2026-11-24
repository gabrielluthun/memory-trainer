import { paraglideVitePlugin } from '@inlang/paraglide-js';
import adapter from '@sveltejs/adapter-static';
import { withPwa } from '@vite-pwa/sveltekit';
import { readFileSync } from 'node:fs';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

/** The version of the app, from package.json (ADR 0023). */
const { version } = JSON.parse(
	readFileSync(new URL('./package.json', import.meta.url), 'utf8')
) as {
	version: string;
};

/**
 * Publishes version.json with the site (deployment, section 5): before each synchronisation, the
 * app compares it to its own version. Never kept by the service worker (its patterns leave JSON
 * out) nor by the browser (read with `cache: 'no-store'`).
 */
function publishedVersion(): Plugin {
	const body = JSON.stringify({ version });
	return {
		name: 'memory-trainer:published-version',
		configureServer(server) {
			server.middlewares.use('/version.json', (_request, response) => {
				response.setHeader('content-type', 'application/json');
				response.setHeader('cache-control', 'no-store');
				response.end(body);
			});
		},
		generateBundle() {
			this.emitFile({ type: 'asset', fileName: 'version.json', source: body });
		}
	};
}

export default defineConfig({
	// The version of this device, compared to version.json (FetchAppVersion).
	define: { __APP_VERSION__: JSON.stringify(version) },
	plugins: [
		publishedVersion(),
		// Interface texts (ADR 0026), resolved from the settings without reloading (ADR 0029).
		// Same options as the "i18n" script, which compiles before lint and type checks.
		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/lib/paraglide',
			strategy: ['custom-settings', 'baseLocale']
		}),
		// SvelteKit, wrapped by the service worker plugin (ADR 0008, US20): the whole app is kept on
		// the device and opens without network (ENF02).
		...withPwa(
			{
				compilerOptions: {
					// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
					runes: ({ filename }) =>
						filename.split(/[/\\]/).includes('node_modules') ? undefined : true
				},
				// SPA mode (ADR 0007): no server rendering, every path falls back to index.html.
				// Cloudflare Pages serves index.html for unknown paths when there is no 404.html.
				adapter: adapter({ fallback: 'index.html' })
			},
			{
				strategies: 'generateSW',
				// A new version waits for the practitioner, never during a trial (deployment, section 5).
				registerType: 'prompt',
				injectRegister: false,
				// The app page is kept under "/": the hosting serves it there, not as /index.html.
				kit: { adapterFallback: 'index.html', spa: { fallbackMapping: '/' } },
				manifest: {
					name: 'memory-trainer',
					short_name: 'memory-trainer',
					description: 'Entraînement à la mémorisation au format Memory League',
					lang: 'fr',
					start_url: '/',
					scope: '/',
					display: 'standalone',
					background_color: '#f4f7fb',
					theme_color: '#1b2a4a',
					icons: [
						{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
						{ src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
						{
							src: '/icons/icon-maskable-512.png',
							sizes: '512x512',
							type: 'image/png',
							purpose: 'maskable'
						}
					]
				},
				generateSW: {
					// The app, its fonts and icons only, from the client build: never an answer of the
					// Data API or of Hanko (SE5). The index.html fallback is added by `kit.spa`.
					globPatterns: ['client/**/*.{js,css,woff2,svg,png,webmanifest}'],
					// The plugin also looks for prerendered pages; this SPA has none (ADR 0007).
					globStrict: false,
					// Any path opened offline gets the app (SPA), from the page kept under "/".
					navigateFallback: '/',
					cleanupOutdatedCaches: true
				}
			}
		)
	],
	// Test strategy: docs/06-qualite-deploiement/tests.md (ADR 0021).
	test: {
		projects: [
			{
				// Domain and Application: pure TypeScript, fake clocks, fake randomness, in-memory fakes.
				extends: true,
				test: {
					name: 'unit',
					environment: 'node',
					include: [
						'src/lib/domain/**/*.test.ts',
						'src/lib/application/**/*.test.ts',
						'src/lib/presentation/**/*.test.ts',
						'tests/fakes/**/*.test.ts'
					]
				}
			},
			{
				// Infrastructure: Dexie.js on an in-memory IndexedDB (fake-indexeddb).
				extends: true,
				test: {
					name: 'infrastructure',
					environment: 'node',
					include: ['src/lib/infrastructure/**/*.test.ts'],
					exclude: ['src/lib/infrastructure/**/*.neon.test.ts'],
					setupFiles: ['fake-indexeddb/auto']
				}
			},
			{
				// Database: PostgreSQL in process (PGlite), built from the migrations. No secret, no network.
				extends: true,
				test: {
					name: 'db',
					environment: 'node',
					include: ['tests/db/**/*.test.ts'],
					testTimeout: 30_000
				}
			}
		],
		coverage: {
			provider: 'v8',
			// The blocking threshold applies to the domain only (business rules, O3).
			include: ['src/lib/domain/**/*.ts'],
			exclude: ['src/lib/domain/**/*.test.ts'],
			thresholds: { lines: 90, branches: 90 }
		}
	}
});
