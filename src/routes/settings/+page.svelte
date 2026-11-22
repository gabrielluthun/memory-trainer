<script lang="ts">
	import { getApp } from '#lib/app-container.ts';
	import AppHeader from '#lib/presentation/components/app-header.svelte';

	const app = getApp();
	const sizes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
	let saved = $state(false);

	// Interface language comes with US19; synchronisation between devices with US21.
	async function choose(size: number) {
		await app.ready;
		await app.settings.setGroupSize('numbers', size);
		saved = true;
	}
</script>

<svelte:head>
	<title>Paramètres — memory-trainer</title>
</svelte:head>

<AppHeader />

<main class="settings">
	<h1>Paramètres</h1>

	<section class="card" aria-labelledby="groups-title">
		<h2 id="groups-title">Taille des groupes</h2>
		<p class="hint">
			Pendant la mémorisation, chaque appui sur → avance d'un groupe. S'applique aux essais
			suivants.
		</p>
		<div class="row">
			<span id="numbers-label" class="discipline">Numbers</span>
			<div class="sizes" role="radiogroup" aria-labelledby="numbers-label">
				{#each sizes as size (size)}
					<button
						type="button"
						role="radio"
						aria-checked={app.settings.current.groupSizeFor('numbers') === size}
						class:selected={app.settings.current.groupSizeFor('numbers') === size}
						onclick={() => choose(size)}
					>
						{size}
					</button>
				{/each}
			</div>
			<span class="unit">chiffres</span>
		</div>
		<p class="status" role="status">{saved ? 'Enregistré sur cet appareil.' : ''}</p>
	</section>
</main>

<style>
	.settings {
		max-width: 60rem;
		padding: 3rem 2.5rem;
	}
	h1 {
		font-size: 3rem;
		margin-bottom: 2rem;
	}
	.card {
		padding: 2rem;
		background: var(--sheet);
		border: 1px solid var(--line);
		border-radius: 1.25rem;
		box-shadow: var(--shadow);
	}
	h2 {
		font-size: 1.4rem;
	}
	.hint {
		margin: 0.5rem 0 1.5rem;
		color: var(--ink-muted);
	}
	.row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 1rem;
	}
	.discipline {
		min-width: 7rem;
		font-weight: 700;
	}
	.sizes {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}
	.sizes button {
		min-width: 2.75rem;
		min-height: 2.75rem;
		border: 1.5px solid var(--line);
		border-radius: var(--radius-small);
		background: var(--sheet);
		font-family: var(--font-digits);
		font-weight: 700;
		cursor: pointer;
	}
	.sizes button.selected {
		border-color: var(--pen);
		background: var(--pen-wash);
		color: var(--pen);
	}
	.unit {
		color: var(--ink-muted);
	}
	.status {
		min-height: 1.5rem;
		margin: 1rem 0 0;
		color: var(--right);
	}
	@media (max-width: 760px) {
		.settings {
			padding: 2rem 1rem;
		}
		h1 {
			font-size: 2.25rem;
		}
	}
</style>
