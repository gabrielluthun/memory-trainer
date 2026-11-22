<script lang="ts">
	import { getApp } from '#lib/app-container.ts';
	import AppHeader from '#lib/presentation/components/app-header.svelte';
	import PausePicker from '#lib/presentation/components/pause-picker.svelte';

	const app = getApp();
	const sizes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
	let saved = $state(false);

	const groupSize = $derived(app.settings.current.groupSizeFor('numbers'));
	const pauses = $derived(app.settings.current.pausesFor('numbers'));

	// Interface language comes with US19; synchronisation between devices with US21.
	async function save(change: () => Promise<void>) {
		saved = false;
		await app.ready;
		await change();
		saved = true;
	}
</script>

<svelte:head>
	<title>Paramètres — memory-trainer</title>
</svelte:head>

<AppHeader />

<main class="settings">
	<h1>Paramètres</h1>

	<section class="card" aria-label="Numbers">
		<div class="row">
			<div>
				<label for="group-size" class="title">Taille des groupes, Numbers</label>
				<p class="hint">Chiffres affichés à la fois, de 1 à 10</p>
			</div>
			<select
				id="group-size"
				value={groupSize}
				onchange={(event) => {
					// Read now: the browser clears currentTarget once the event is over.
					const size = Number(event.currentTarget.value);
					void save(() => app.settings.setGroupSize('numbers', size));
				}}
			>
				{#each sizes as size (size)}
					<option value={size}>{size}</option>
				{/each}
			</select>
		</div>

		<div class="row pauses">
			<div>
				<span class="title">Pauses de préparation, Numbers</span>
				<p class="hint">
					Proposées au lancement ; changer les pauses au lancement les met à jour ici.
				</p>
			</div>
			<div class="pickers">
				<PausePicker
					label="Avant la mémorisation"
					valueMs={pauses.beforeMemorizationMs}
					onchange={(ms: number) =>
						save(() => app.settings.setPauses('numbers', { ...pauses, beforeMemorizationMs: ms }))}
				/>
				<PausePicker
					label="Avant le rappel"
					valueMs={pauses.beforeRecallMs}
					onchange={(ms: number) =>
						save(() => app.settings.setPauses('numbers', { ...pauses, beforeRecallMs: ms }))}
				/>
			</div>
		</div>
	</section>

	<p class="status" role="status">{saved ? 'Enregistré sur cet appareil.' : ''}</p>
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
		padding: 0.5rem 2rem;
		background: var(--sheet);
		border: 1px solid var(--line);
		border-radius: 1.25rem;
	}
	.row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 2rem;
		padding: 1.5rem 0;
	}
	.row + .row {
		border-top: 1px solid var(--line);
	}
	.pauses {
		flex-direction: column;
		align-items: stretch;
	}
	.pickers {
		display: grid;
		gap: 1.5rem;
	}
	.title {
		display: block;
		font-weight: 700;
		font-size: 1.2rem;
	}
	.hint {
		margin: 0.25rem 0 0;
		color: var(--ink-muted);
	}
	select {
		min-width: 6rem;
		min-height: 3.5rem;
		padding: 0 1rem;
		border: 1.5px solid var(--line);
		border-radius: var(--radius);
		background: var(--sheet);
		color: var(--ink);
		font: inherit;
		font-family: var(--font-digits);
		font-size: 1.3rem;
		text-align: center;
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
		.card {
			padding: 0.5rem 1.25rem;
		}
	}
</style>
