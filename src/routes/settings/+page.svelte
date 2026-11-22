<script lang="ts">
	import { getApp } from '#lib/app-container.ts';
	import AppHeader from '#lib/presentation/components/app-header.svelte';
	import PausePicker from '#lib/presentation/components/pause-picker.svelte';
	import { patternSize, splitGroup } from '#lib/domain/navigation/display-pattern.ts';

	const app = getApp();
	const sizes = [1, 2, 3, 4, 5];
	let saved = $state(false);

	// Display pattern: 1 to 3 subgroups of 1 to 5 digits (RG11, ADR 0027).
	const pattern = $derived(app.settings.current.groupPatternFor('numbers'));
	const sample = [4, 2, 7, 9, 1, 8, 3, 6, 0, 5, 2, 4, 7, 1, 9];
	const preview = $derived(
		splitGroup(sample.slice(0, patternSize(pattern)), pattern)
			.map((subgroup) => subgroup.join(''))
			.join(' ')
	);

	/** Sets subgroup `index` to `value`; an empty value removes it and the ones after. */
	function changePattern(index: number, value: string) {
		const next = pattern.slice(0, index);
		if (value !== '') next.push(Number(value), ...pattern.slice(index + 1));
		void save(() => app.settings.setGroupPattern('numbers', next));
	}

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
				<span id="pattern-title" class="title">Motif d'affichage, Numbers</span>
				<p class="hint">1 à 3 groupes de 1 à 5 chiffres, montrés ensemble à chaque appui sur →</p>
			</div>
			<div class="pattern" role="group" aria-labelledby="pattern-title">
				{#each [0, 1, 2] as index (index)}
					<select
						aria-label="Groupe {index + 1}"
						value={pattern[index] ?? ''}
						disabled={index > pattern.length}
						onchange={(event) => changePattern(index, event.currentTarget.value)}
					>
						{#if index > 0}<option value="">—</option>{/if}
						{#each sizes as size (size)}
							<option value={size}>{size}</option>
						{/each}
					</select>
				{/each}
				<output class="preview" aria-label="Aperçu">{preview}</output>
			</div>
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
	.pattern {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.6rem;
	}
	.preview {
		min-width: 8rem;
		margin-left: 0.75rem;
		font-family: var(--font-digits);
		font-weight: 700;
		font-size: 1.6rem;
		white-space: pre;
	}
	select:disabled {
		opacity: 0.45;
	}
	select {
		min-width: 4.5rem;
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
