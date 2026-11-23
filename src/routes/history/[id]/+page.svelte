<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { getApp } from '#lib/app-container.ts';
	import type { TrialDetail } from '#lib/application/ports.ts';
	import AppHeader from '#lib/presentation/components/app-header.svelte';
	import CorrectedCopy from '#lib/presentation/components/corrected-copy.svelte';
	import TrialResult from '#lib/presentation/components/trial-result.svelte';

	/**
	 * A trial opened from the history (US12 CA2): the same result screen as at the end of a
	 * trial (CU04). The display pattern is the current one of the settings: it is not stored
	 * with the trial, and only changes how the cells are spaced (decision during US12).
	 */
	const app = getApp();

	let detail = $state<TrialDetail | null | undefined>(undefined);

	$effect(() => {
		const id = page.params.id ?? '';
		void app.history.get(id).then((found) => (detail = found));
	});

	const pattern = $derived(
		detail ? app.settings.current.groupPatternFor(detail.discipline) : ([2] as const)
	);
</script>

<svelte:head>
	<title>Essai de Numbers — memory-trainer</title>
</svelte:head>

<AppHeader />

<main class="result">
	{#if detail === null}
		<div class="missing">
			<p>Cet essai n'est pas sur cet appareil.</p>
			<a class="button button-secondary" href={resolve('/history')}>Historique</a>
		</div>
	{:else if detail && detail.score !== null}
		<TrialResult
			score={detail.score}
			itemCount={detail.itemCount}
			memorizationMs={detail.memorizationMs ?? 0}
			recallMs={detail.recallMs ?? 0}
			mode={detail.mode}
		/>
		<CorrectedCopy results={detail.results} pattern={[...pattern]} />
	{:else if detail}
		<!-- Kept out of the statistics: never scored, so there is no corrected copy (RG23). -->
		<div class="missing">
			<p>
				{detail.status === 'abandoned' ? 'Essai abandonné' : 'Essai interrompu'}, gardé hors
				statistiques : il n'a pas été corrigé.
			</p>
			<a class="button button-secondary" href={resolve('/history')}>Historique</a>
		</div>
	{/if}
</main>

<style>
	.result {
		max-width: 110rem;
		margin: 0 auto;
		padding: 0 2.5rem 3rem;
	}
	.missing {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 1.25rem;
		padding-top: 3rem;
		color: var(--ink-muted);
		font-size: 1.2rem;
	}
	@media (max-width: 760px) {
		.result {
			padding: 0 1rem 2rem;
		}
	}
</style>
