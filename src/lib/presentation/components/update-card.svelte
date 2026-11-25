<script lang="ts">
	import { m } from '../../paraglide/messages';

	/**
	 * "Nouvelle version disponible" (deployment, section 5): at the bottom of the screen, outside a
	 * trial, in the style of the installation reminder (mock-up 12). The cross hides it until the
	 * next opening.
	 */
	let {
		syncWaits,
		oninstall,
		onclose
	}: { syncWaits: boolean; oninstall: () => void; onclose: () => void } = $props();

	let installing = $state(false);

	function install() {
		installing = true;
		oninstall();
	}
</script>

<aside class="update-card" aria-labelledby="update-card-title">
	<div class="text">
		<p id="update-card-title" class="title">{m.update_available()}</p>
		{#if syncWaits}
			<p class="hint">{m.update_sync_waits()}</p>
		{/if}
	</div>
	<button class="button button-primary" type="button" disabled={installing} onclick={install}>
		{m.update_install()}
	</button>
	<button class="close" type="button" aria-label={m.update_close()} onclick={onclose}>✕</button>
</aside>

<style>
	.update-card {
		position: fixed;
		right: 1.5rem;
		bottom: 1.5rem;
		z-index: 20;
		display: flex;
		align-items: center;
		gap: 1rem;
		max-width: min(34rem, calc(100vw - 2rem));
		padding: 1rem 1rem 1rem 1.4rem;
		background: var(--sheet);
		border: 1px solid var(--line);
		border-radius: var(--radius);
		box-shadow: var(--shadow);
	}
	.text {
		flex: 1;
	}
	.title {
		margin: 0;
		font-weight: 700;
	}
	.hint {
		margin: 0.2rem 0 0;
		color: var(--waiting);
		font-size: 0.95rem;
	}
	.button {
		min-height: 2.75rem;
		padding: 0 1.2rem;
		font-size: 1rem;
	}
	.close {
		align-self: flex-start;
		padding: 0.25rem 0.4rem;
		border: 0;
		background: none;
		color: var(--ink-muted);
		font: inherit;
		cursor: pointer;
	}
	/* Above the tab bar of the phone (app header), within thumb reach. */
	@media (max-width: 760px) {
		.update-card {
			right: 1rem;
			left: 1rem;
			bottom: calc(5.5rem + env(safe-area-inset-bottom));
			max-width: none;
			flex-wrap: wrap;
		}
		.text {
			flex-basis: calc(100% - 3rem);
		}
		.close {
			order: -1;
			margin-left: auto;
		}
		.button {
			width: 100%;
		}
	}
</style>
