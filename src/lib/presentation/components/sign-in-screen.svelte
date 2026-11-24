<script lang="ts">
	/**
	 * Sign-in screen (mock-up 11, CU16): Hanko's <hanko-auth> element inside the card, in the
	 * interface language (ADR 0030). "Continuer hors connexion" closes it until the next opening.
	 */
	import { m } from '../../paraglide/messages';
	import { getLocale } from '../../paraglide/runtime';
	import AppHeader from './app-header.svelte';

	let { ondismiss }: { ondismiss: () => void } = $props();
</script>

<svelte:head>
	<title>{m.sign_in_title()} — memory-trainer</title>
</svelte:head>

<AppHeader minimal />

<main class="sign-in">
	<section class="card" aria-labelledby="sign-in-title">
		<div class="key" aria-hidden="true">
			<svg viewBox="0 0 24 24">
				<circle cx="8" cy="12" r="3.5" /><path d="M11.5 12H21v3M17 12v2.5" />
			</svg>
		</div>
		<h1 id="sign-in-title">{m.sign_in_title()}</h1>
		<p class="lead">{m.sign_in_lead()}</p>
		<hanko-auth lang={getLocale()}></hanko-auth>
		<p class="hint">{m.sign_in_devices()}</p>
	</section>

	<button class="offline" type="button" onclick={ondismiss}>{m.sign_in_offline()}</button>
	<p class="note">{m.sign_in_offline_note()}</p>
</main>

<style>
	.sign-in {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 5rem 1rem 3rem;
		text-align: center;
	}
	.card {
		width: min(100%, 34rem);
		padding: 2.75rem 2.5rem 2rem;
		background: var(--sheet);
		border: 1px solid var(--line);
		border-radius: 1.25rem;
		box-shadow: var(--shadow);
	}
	.key {
		display: grid;
		place-items: center;
		width: 4.25rem;
		height: 4.25rem;
		margin: 0 auto 1.25rem;
		border-radius: 1rem;
		background: var(--pen-wash);
		color: var(--pen);
	}
	.key svg {
		width: 1.75rem;
		height: 1.75rem;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.8;
		stroke-linecap: round;
	}
	h1 {
		margin: 0 0 1rem;
		font-size: 2.1rem;
	}
	.lead {
		margin: 0 0 1.5rem;
		color: var(--ink-muted);
		font-size: 1.15rem;
	}
	/* Hanko's element, in the colours of the app (variables of hanko-elements). */
	hanko-auth {
		--font-family: var(--font-ui);
		--font-size: 1.05rem;
		--font-weight: 700;
		--color: var(--ink);
		--color-shade-1: var(--ink-muted);
		--color-shade-2: var(--line);
		--brand-color: var(--ink);
		--brand-contrast-color: var(--sheet);
		--background-color: var(--sheet);
		--error-color: var(--correction);
		--link-color: var(--pen);
		--border-radius: var(--radius);
		--item-height: 3.5rem;
		--container-padding: 0;
		--container-max-width: 100%;
		display: block;
	}
	/* The title of the card already says it. */
	hanko-auth::part(headline1) {
		display: none;
	}
	.hint {
		margin: 1rem 0 0;
		color: var(--ink-faint);
		font-size: 0.95rem;
	}
	.offline {
		margin-top: 2.5rem;
		padding: 0.5rem 1rem;
		border: 0;
		background: none;
		color: var(--ink-muted);
		font: inherit;
		font-weight: 700;
		font-size: 1.15rem;
		cursor: pointer;
	}
	.note {
		max-width: 30rem;
		margin: 1.5rem 0 0;
		color: var(--ink-muted);
	}
	@media (max-width: 760px) {
		.sign-in {
			padding-top: 2.5rem;
		}
		.card {
			padding: 2rem 1.25rem 1.5rem;
		}
	}
</style>
