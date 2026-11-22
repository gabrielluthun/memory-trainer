<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import Logo from './logo.svelte';

	// History (US12) and sync status (US21) join the header with their user stories.
	const links = [
		{ href: resolve('/'), label: 'Accueil' },
		{ href: resolve('/settings'), label: 'Paramètres' }
	];
</script>

<header class="app-header">
	<a class="brand" href={resolve('/')}>
		<Logo />
		<span>memory-trainer</span>
	</a>
	<nav aria-label="Navigation principale">
		{#each links as link (link.href)}
			<a
				href={link.href}
				class:active={page.url.pathname === link.href}
				aria-current={page.url.pathname === link.href ? 'page' : undefined}
			>
				{link.label}
			</a>
		{/each}
	</nav>
</header>

<style>
	.app-header {
		display: flex;
		align-items: center;
		gap: 2.5rem;
		padding: 0.9rem 2.5rem;
		background: var(--sheet);
		border-bottom: 1px solid var(--line);
	}
	.brand {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		font-weight: 700;
		font-size: 1.3rem;
		text-decoration: none;
	}
	nav {
		display: flex;
		gap: 0.25rem;
	}
	nav a {
		padding: 0.5rem 1rem;
		border-radius: var(--radius-small);
		color: var(--ink-muted);
		font-weight: 500;
		text-decoration: none;
	}
	nav a.active {
		background: var(--paper);
		color: var(--ink);
	}
	@media (max-width: 640px) {
		.app-header {
			gap: 1rem;
			padding: 0.75rem 1rem;
		}
		.brand span {
			display: none;
		}
	}
</style>
