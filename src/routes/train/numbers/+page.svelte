<script lang="ts">
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { getApp } from '#lib/app-container.ts';
	import { onMount } from 'svelte';
	import AppHeader from '#lib/presentation/components/app-header.svelte';
	import PausePicker from '#lib/presentation/components/pause-picker.svelte';
	import { formatCountdown } from '#lib/presentation/format.ts';

	const app = getApp();
	const format = app.session.standardFormat;
	let starting = $state(false);

	// The last pauses chosen for Numbers are proposed (RG25). Custom mode comes with US09.
	let pauses = $state(app.settings.current.pausesFor('numbers'));
	let pausesChanged = false;
	onMount(() => {
		// The stored settings may load after a first click: never overwrite a choice just made.
		void app.ready.then(() => {
			if (!pausesChanged) pauses = app.settings.current.pausesFor('numbers');
		});
	});

	function choosePauses(changed: Partial<typeof pauses>) {
		pausesChanged = true;
		pauses = { ...pauses, ...changed };
	}

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
		if (starting) return;
		starting = true;
		await app.ready;
		app.session.start({ pauses });
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
				<button type="button" role="radio" aria-checked="true" class="selected">Standard</button>
				<button type="button" role="radio" aria-checked="false" disabled title="Bientôt">
					Personnalisé
				</button>
			</div>
			<p class="hint">
				{format.itemCount} chiffres, {format.memorizationMs / 60_000} min de mémorisation, {format.recallMs /
					60_000} min de rappel. Comme sur Memory League.
			</p>

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
			<button class="button button-primary start" type="button" onclick={start} disabled={starting}>
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
	.mode button:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}
	.hint {
		margin: 0.75rem 0 0;
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
	}
</style>
