<script lang="ts">
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { getApp } from '#lib/app-container.ts';
	import { onMount } from 'svelte';
	import AppHeader from '#lib/presentation/components/app-header.svelte';
	import PausePicker from '#lib/presentation/components/pause-picker.svelte';
	import { CUSTOM_LIMITS } from '#lib/domain/format.ts';
	import type { Mode } from '#lib/domain/trial/trial.ts';
	import {
		formatDurationField,
		parseDurationField,
		stepDown,
		stepUp
	} from '#lib/presentation/custom-duration.ts';
	import { formatCountdown } from '#lib/presentation/format.ts';

	const app = getApp();
	const standard = app.session.standardFormat;
	let starting = $state(false);

	// The last pauses, mode and custom settings of Numbers are proposed (RG25, US09 CA4).
	let pauses = $state(app.settings.current.pausesFor('numbers'));
	let mode = $state<Mode>('standard');
	let itemCountText = $state('');
	let durationText = $state('');
	let changed = false;

	function proposeLastLaunch() {
		const launch = app.settings.current.launchFor('numbers', standard);
		pauses = app.settings.current.pausesFor('numbers');
		mode = launch.mode;
		itemCountText = String(launch.custom.itemCount);
		durationText = formatDurationField(launch.custom.memorizationMs / 1_000);
	}
	proposeLastLaunch();

	onMount(() => {
		// The stored settings may load after a first click: never overwrite a choice just made.
		void app.ready.then(() => {
			if (!changed) proposeLastLaunch();
		});
	});

	function choosePauses(update: Partial<typeof pauses>) {
		changed = true;
		pauses = { ...pauses, ...update };
	}

	function chooseMode(chosen: Mode) {
		changed = true;
		mode = chosen;
	}

	// Custom settings (RG15): 1 to 500 digits, 0:01 to 60:00, whole seconds.
	const itemCount = $derived.by(() => {
		const count = /^\d{1,3}$/.test(itemCountText.trim()) ? Number(itemCountText) : NaN;
		return count >= CUSTOM_LIMITS.minItems && count <= CUSTOM_LIMITS.maxItems ? count : null;
	});
	const durationS = $derived(parseDurationField(durationText));
	const customValid = $derived(itemCount !== null && durationS !== null);
	const canStart = $derived(mode === 'standard' || customValid);

	/** − and + by a step that grows with the time (ADR 0028). */
	function stepDuration(step: (seconds: number) => number) {
		changed = true;
		durationText = formatDurationField(step(durationS ?? standard.memorizationMs / 1_000));
	}

	/** A readable time is shown back as m:ss ("90" becomes "1:30"). */
	function tidyDuration() {
		if (durationS !== null) durationText = formatDurationField(durationS);
	}

	const format = $derived(
		mode === 'custom' && customValid
			? {
					itemCount: itemCount ?? 0,
					memorizationMs: (durationS ?? 0) * 1_000,
					recallMs: standard.recallMs
				}
			: standard
	);

	const pauseHint = (ms: number, hidden: string) => (ms === 0 ? 'Aucune' : hidden);
	const steps = $derived([
		{
			name: 'Pause',
			hint: pauseHint(pauses.beforeMemorizationMs, 'Les chiffres sont cachés'),
			value: `${pauses.beforeMemorizationMs / 1_000} s`
		},
		{
			name: 'Mémorisation',
			hint: 'Arrêtez quand vous voulez',
			value: formatCountdown(format.memorizationMs)
		},
		{
			name: 'Pause',
			hint: pauseHint(pauses.beforeRecallMs, 'Les chiffres sont cachés'),
			value: `${pauses.beforeRecallMs / 1_000} s`
		},
		{
			name: 'Rappel',
			hint: 'Saisissez les chiffres dans l’ordre',
			value: formatCountdown(format.recallMs)
		}
	]);

	async function start() {
		if (starting || !canStart) return;
		starting = true;
		await app.ready;
		// In standard mode, the custom settings kept are the last valid ones (US09 CA4).
		const last = app.settings.current.launchFor('numbers', standard).custom;
		const custom = customValid
			? { itemCount: itemCount ?? 0, memorizationMs: (durationS ?? 0) * 1_000 }
			: last;
		app.session.start({ pauses, launch: { mode, custom } });
		await goto(resolve('/trial'));
	}

	function onkeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.repeat) {
			event.preventDefault();
			void start();
		}
	}
</script>

<svelte:head>
	<title>Lancer un essai de Numbers — memory-trainer</title>
</svelte:head>

<svelte:window {onkeydown} />

<AppHeader />

<main class="launch">
	<a class="back" href={resolve('/')}><span aria-hidden="true">‹</span> Accueil</a>
	<h1>Lancer un essai de Numbers</h1>

	<div class="columns">
		<section aria-labelledby="mode-title">
			<h2 id="mode-title" class="label">Mode</h2>
			<div class="mode" role="radiogroup" aria-labelledby="mode-title">
				{#each [['standard', 'Standard'], ['custom', 'Personnalisé']] as const as [value, label] (value)}
					<button
						type="button"
						role="radio"
						aria-checked={mode === value}
						class:selected={mode === value}
						onclick={() => chooseMode(value)}
					>
						{label}
					</button>
				{/each}
			</div>
			<p class="hint">
				{#if mode === 'standard'}
					{standard.itemCount} chiffres, {standard.memorizationMs / 60_000} min de mémorisation, {standard.recallMs /
						60_000} min de rappel. Comme sur Memory League.
				{:else}
					Le nombre de chiffres et la durée de mémorisation de votre choix.
				{/if}
			</p>

			<fieldset
				class="custom"
				disabled={mode !== 'custom'}
				aria-label="Réglages du mode personnalisé"
			>
				<div class="field">
					<label for="item-count">Nombre de chiffres</label>
					<input
						id="item-count"
						type="text"
						inputmode="numeric"
						autocomplete="off"
						aria-invalid={mode === 'custom' && itemCount === null}
						aria-describedby="item-count-error"
						bind:value={itemCountText}
						oninput={() => (changed = true)}
					/>
				</div>
				{#if mode === 'custom' && itemCount === null}
					<p class="error" id="item-count-error">De 1 à 500 chiffres.</p>
				{/if}
				<div class="field">
					<label for="duration">Durée de mémorisation</label>
					<div class="stepper">
						<button
							type="button"
							class="step"
							aria-label="Diminuer la durée"
							onclick={() => stepDuration(stepDown)}
						>
							−
						</button>
						<input
							id="duration"
							type="text"
							autocomplete="off"
							aria-invalid={mode === 'custom' && durationS === null}
							aria-describedby="duration-error"
							bind:value={durationText}
							oninput={() => (changed = true)}
							onblur={tidyDuration}
						/>
						<button
							type="button"
							class="step"
							aria-label="Augmenter la durée"
							onclick={() => stepDuration(stepUp)}
						>
							+
						</button>
					</div>
				</div>
				{#if mode === 'custom' && durationS === null}
					<p class="error" id="duration-error">De 0:01 à 60:00, en minutes et secondes.</p>
				{/if}
				<p class="note">En mode personnalisé, le rappel dure toujours 4 minutes.</p>
			</fieldset>

			<div class="pauses">
				<PausePicker
					label="Pause avant la mémorisation"
					valueMs={pauses.beforeMemorizationMs}
					onchange={(ms: number) => choosePauses({ beforeMemorizationMs: ms })}
				/>
				<PausePicker
					label="Pause avant le rappel"
					valueMs={pauses.beforeRecallMs}
					onchange={(ms: number) => choosePauses({ beforeRecallMs: ms })}
				/>
				<p class="hint">Reprend vos derniers réglages pour Numbers.</p>
			</div>
		</section>

		<section class="plan" aria-labelledby="plan-title">
			<div class="sheet">
				<h2 id="plan-title">Déroulé</h2>
				<ol>
					{#each steps as step, index (index)}
						<li>
							<div>
								<strong>{step.name}</strong>
								<span>{step.hint}</span>
							</div>
							<span class="value">{step.value}</span>
						</li>
					{/each}
				</ol>
			</div>
			<button
				class="button button-primary start"
				type="button"
				onclick={start}
				disabled={starting || !canStart}
			>
				<span aria-hidden="true">▶</span> Commencer
			</button>
			<p class="hint centered">Entrée pour commencer</p>
		</section>
	</div>
</main>

<style>
	.launch {
		max-width: 80rem;
		padding: 2.5rem;
	}
	.back {
		color: var(--ink-muted);
		text-decoration: none;
		font-size: 1.1rem;
	}
	h1 {
		margin: 2rem 0 2.5rem;
		font-size: 3rem;
	}
	.columns {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 5rem;
		align-items: start;
	}
	.label {
		font-size: 1.1rem;
		margin-bottom: 0.75rem;
	}
	.mode {
		display: grid;
		grid-template-columns: 1fr 1fr;
		padding: 0.35rem;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: var(--paper);
	}
	.mode button {
		min-height: 3.25rem;
		border: 0;
		border-radius: var(--radius-small);
		background: transparent;
		color: var(--ink-muted);
		font-weight: 700;
		font-size: 1.15rem;
		cursor: pointer;
	}
	.mode button.selected {
		background: var(--sheet);
		color: var(--ink);
		box-shadow: var(--shadow);
	}
	.hint {
		margin: 0.75rem 0 0;
		color: var(--ink-muted);
		font-size: 0.95rem;
	}
	.custom {
		display: grid;
		/* A fieldset never shrinks below its content by default: it would widen the page on a phone. */
		min-width: 0;
		margin: 2rem 0 0;
		padding: 0.5rem 2rem 1.25rem;
		border: 1.5px dashed var(--line);
		border-radius: var(--radius);
		background: var(--paper);
	}
	.custom:disabled {
		opacity: 0.6;
	}
	.field {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		padding: 1.1rem 0;
		border-bottom: 1px solid var(--line);
	}
	.field label {
		color: var(--ink-muted);
		font-size: 1.15rem;
	}
	.field input {
		width: 8rem;
		min-height: 3.25rem;
		padding: 0 1rem;
		border: 1.5px solid var(--line);
		border-radius: var(--radius-small);
		background: var(--sheet);
		color: var(--ink);
		font-family: var(--font-digits);
		font-size: 1.3rem;
		text-align: right;
	}
	.field input[aria-invalid='true'] {
		border-color: var(--correction);
	}
	.stepper {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.step {
		width: 3.25rem;
		min-height: 3.25rem;
		border: 1.5px solid var(--line);
		border-radius: var(--radius-small);
		background: var(--sheet);
		color: var(--ink);
		font-size: 1.4rem;
		font-weight: 700;
		cursor: pointer;
	}
	.custom:disabled .step {
		cursor: not-allowed;
	}
	.error {
		margin: 0.5rem 0 0;
		color: var(--correction);
		font-size: 0.95rem;
	}
	.note {
		margin: 1rem 0 0;
		color: var(--ink-muted);
		font-size: 0.95rem;
	}
	.pauses {
		display: grid;
		gap: 2rem;
		margin-top: 2.5rem;
	}
	.pauses .hint {
		margin-top: -1rem;
	}
	.centered {
		text-align: center;
	}
	.sheet {
		padding: 1.75rem 2.5rem;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: repeating-linear-gradient(
			var(--sheet) 0 1.45rem,
			color-mix(in srgb, var(--line) 55%, transparent) 1.45rem 1.5rem
		);
	}
	.sheet h2 {
		font-size: 1.15rem;
	}
	ol {
		margin: 0;
		padding: 0;
		list-style: none;
	}
	li {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		padding: 1.1rem 0;
		border-bottom: 1px solid var(--line);
	}
	li:last-child {
		border-bottom: 0;
	}
	li strong {
		display: block;
		font-size: 1.15rem;
	}
	li span {
		color: var(--ink-muted);
		font-size: 0.95rem;
	}
	li .value {
		color: var(--ink);
		font-family: var(--font-digits);
		font-size: 1.6rem;
	}
	.start {
		width: 100%;
		margin-top: 1.5rem;
		min-height: 4rem;
		font-size: 1.3rem;
	}
	@media (max-width: 900px) {
		.launch {
			padding: 1.5rem 1rem;
		}
		h1 {
			font-size: 2rem;
		}
		.columns {
			grid-template-columns: 1fr;
			gap: 2rem;
		}
		.sheet {
			padding: 1.25rem 1.5rem;
		}
		.custom {
			padding: 0.25rem 1.25rem 1rem;
		}
		.field input {
			width: 6.5rem;
		}
		.stepper input {
			width: 5.5rem;
		}
	}
</style>
