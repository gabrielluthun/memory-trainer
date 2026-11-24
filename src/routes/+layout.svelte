<script lang="ts">
	import '../app.css';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { registerSW } from 'virtual:pwa-register';
	import favicon from '#lib/assets/favicon.svg';
	import { getApp } from '#lib/app-container.ts';
	import type { AbandonChoice } from '#lib/application/trial-session.svelte.ts';
	import type { PendingDecision } from '#lib/domain/trial/trial.ts';
	import FateDialog from '#lib/presentation/components/fate-dialog.svelte';
	import SignInScreen from '#lib/presentation/components/sign-in-screen.svelte';
	import { describeInterruptedTrial } from '#lib/presentation/interrupted-trial-text.ts';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	const app = getApp();

	/** A trial interrupted by an outside incident, found at opening (SEQ01, CU06). */
	let interrupted = $state<PendingDecision | null>(null);
	const text = $derived(
		interrupted && describeInterruptedTrial(interrupted, new Date(), getLocale())
	);

	onMount(() => {
		// The app is kept on the device and opens without network (US20, ENF02).
		registerSW({ immediate: true });
		// Online without a session: the sign-in screen, until "Continuer hors connexion" (CU16).
		// Then the trials and settings waiting on the device are sent, those of the other devices
		// received; and again when the network comes back, and every 5 minutes (CU17).
		void app.connection.open().then(() => app.sync.sync());
		const stopTriggers = app.sync.startTriggers();
		// A damaged save must not block the app: the next trial replaces it.
		app.recovery
			.check()
			.then((pending) => (interrupted = pending))
			.catch(() => {});
		return stopTriggers;
	});

	/** "Compter tel quel" shows the result (CU04); the two other choices stay where we are (RG23). */
	async function choose(choice: AbandonChoice) {
		const completed = await app.recovery.decide(choice);
		interrupted = null;
		if (completed) await goto(resolve('/history/[id]', { id: completed.id }));
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if app.connection.prompting}
	<SignInScreen ondismiss={() => app.connection.dismiss()} />
{:else}
	{@render children()}
{/if}

{#if interrupted && text}
	<FateDialog
		title={text.title}
		intro={text.intro}
		countAsIsHint={m.interrupted_count_hint()}
		onchoose={choose}
	>
		{#snippet badge()}
			<span class="badge">{m.interrupted_badge()}</span>
		{/snippet}
	</FateDialog>
{/if}

<style>
	.badge {
		display: inline-block;
		margin-bottom: 1.25rem;
		padding: 0.35rem 0.75rem;
		border-radius: 0.5rem;
		background: color-mix(in srgb, var(--waiting) 14%, transparent);
		color: var(--waiting);
		font-weight: 700;
	}
</style>
