import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			// SPA mode (ADR 0007): no server rendering, every path falls back to index.html.
			// Cloudflare Pages serves index.html for unknown paths when there is no 404.html.
			adapter: adapter({ fallback: 'index.html' })
		})
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
