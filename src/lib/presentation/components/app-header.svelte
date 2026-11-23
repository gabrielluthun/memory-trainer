<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import Logo from './logo.svelte';

	// The sync status (US21) joins the header with its user story.
	const links = [
		{ href: resolve('/'), label: 'Accueil', icon: 'home' },
		{ href: resolve('/history'), label: 'Historique', icon: 'list' },
		{ href: resolve('/settings'), label: 'Paramètres', icon: 'gear' }
	] as const;

	const home = resolve('/');

	/** The trial detail opened from the history keeps the "Historique" tab active. */
	function isActive(href: string): boolean {
		const path = page.url.pathname;
		return href === home ? path === home : path === href || path.startsWith(`${href}/`);
	}
</script>

<header class="app-header">
	<a class="brand" href={home}>
		<Logo />
		<span>memory-trainer</span>
	</a>
	<!-- On a computer, links in the top bar; on a phone, a tab bar at the bottom (wireframes). -->
	<nav aria-label="Navigation principale">
		{#each links as link (link.href)}
			<a
				href={link.href}
				class:active={isActive(link.href)}
				aria-current={isActive(link.href) ? 'page' : undefined}
			>
				<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
					{#if link.icon === 'home'}
						<path d="M4 11 12 4l8 7v9h-5v-6H9v6H4z" />
					{:else if link.icon === 'list'}
						<path d="M4 6h16M4 12h16M4 18h10" />
					{:else}
						<circle cx="12" cy="12" r="3.2" />
						<path
							d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"
						/>
					{/if}
				</svg>
				<span>{link.label}</span>
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
	.icon {
		display: none;
		width: 1.6rem;
		height: 1.6rem;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.7;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	@media (max-width: 760px) {
		.app-header {
			gap: 1rem;
			padding: 0.75rem 1rem;
		}
		.brand span {
			display: none;
		}
		/* Tab bar at the bottom, within thumb reach. */
		nav {
			position: fixed;
			inset: auto 0 0 0;
			z-index: 10;
			display: grid;
			grid-template-columns: repeat(3, 1fr);
			gap: 0;
			padding: 0.5rem 0 calc(0.5rem + env(safe-area-inset-bottom));
			background: var(--sheet);
			border-top: 1px solid var(--line);
		}
		nav a {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 0.2rem;
			padding: 0.35rem 0;
			font-size: 0.85rem;
		}
		nav a.active {
			background: none;
			font-weight: 700;
		}
		.icon {
			display: block;
		}
		/* Room for the tab bar under the last content of the page. */
		:global(body) {
			padding-bottom: calc(5rem + env(safe-area-inset-bottom));
		}
	}
</style>
