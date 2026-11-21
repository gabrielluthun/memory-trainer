import { defineConfig, devices } from '@playwright/test';

// End-to-end tests (ADR 0021): the three engines, plus emulated phone and tablets.
// Real devices are checked during acceptance in production (docs/06-qualite-deploiement/recette.md).

const port = 4173;

export default defineConfig({
	testDir: 'tests/e2e',
	testMatch: '**/*.test.ts',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
	use: {
		baseURL: `http://localhost:${port}`,
		trace: 'on-first-retry'
	},
	webServer: {
		command: `npm run build && npm run preview -- --port ${port} --strictPort`,
		port,
		reuseExistingServer: !process.env.CI
	},
	projects: [
		{ name: 'chromium', use: { ...devices['Desktop Chrome'] } },
		{ name: 'firefox', use: { ...devices['Desktop Firefox'] } },
		{ name: 'webkit', use: { ...devices['Desktop Safari'] } },
		{ name: 'iphone', use: { ...devices['iPhone 15'] } },
		{ name: 'ipad', use: { ...devices['iPad Pro 11'] } },
		{ name: 'android', use: { ...devices['Pixel 7'] } }
	]
});
