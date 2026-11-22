<script lang="ts">
	import { resolve } from '$app/paths';
	import AppHeader from '#lib/presentation/components/app-header.svelte';

	const hour = new Date().getHours();
	const greeting = hour >= 18 || hour < 5 ? 'Bonsoir.' : 'Bonjour.';
	const comingSoon = ['Cards', 'Images', 'Words', 'Names', 'International Names'];
	// Decorative preview of the Numbers sheet (not a real draw).
	const preview = ['41 59 26 53', '58 97 93 23', '84 62 64 33'];
</script>

<svelte:head>
	<title>memory-trainer</title>
</svelte:head>

<AppHeader />

<main class="home">
	<h1>{greeting}</h1>
	<p class="lead">Une série de Numbers ?</p>

	<section class="discipline" aria-labelledby="numbers-title">
		<div class="discipline-text">
			<h2 id="numbers-title">Numbers</h2>
			<p>80 chiffres à mémoriser en 1 minute, puis 4 minutes pour les restituer dans l'ordre.</p>
			<a class="button button-primary" href={resolve('/train/numbers')}>
				<span aria-hidden="true">▶</span> Lancer un essai
			</a>
		</div>
		<div class="preview" aria-hidden="true">
			{#each preview as line, index (index)}
				<p class:faded={index === preview.length - 1}>{line}</p>
			{/each}
		</div>
	</section>

	<section class="soon" aria-labelledby="soon-title">
		<h2 id="soon-title">Bientôt</h2>
		<ul>
			{#each comingSoon as name (name)}
				<li>{name}</li>
			{/each}
		</ul>
	</section>
</main>

<style>
	.home {
		max-width: 75rem;
		padding: 4rem 2.5rem;
	}
	h1 {
		font-size: 3.5rem;
	}
	.lead {
		margin: 0.75rem 0 2.5rem;
		color: var(--ink-muted);
		font-size: 1.35rem;
	}
	.discipline {
		display: grid;
		grid-template-columns: 1fr minmax(16rem, 22rem);
		gap: 2rem;
		align-items: center;
		max-width: 52rem;
		padding: 2.25rem;
		background: var(--sheet);
		border: 1px solid var(--line);
		border-radius: 1.25rem;
		box-shadow: var(--shadow);
	}
	.discipline h2 {
		font-size: 2rem;
	}
	.discipline-text p {
		margin: 1rem 0 1.75rem;
		color: var(--ink-muted);
		font-size: 1.15rem;
	}
	.preview {
		padding: 1rem 1.5rem;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: repeating-linear-gradient(
			var(--sheet) 0 0.95rem,
			color-mix(in srgb, var(--line) 70%, transparent) 0.95rem 1rem
		);
	}
	.preview p {
		margin: 0.4rem 0;
		font-family: var(--font-digits);
		font-size: 2rem;
		letter-spacing: 0.15em;
		word-spacing: 0.6em;
		white-space: nowrap;
	}
	.preview .faded {
		color: var(--ink-faint);
	}
	.soon {
		margin-top: 3rem;
	}
	.soon h2 {
		font-size: 1.1rem;
	}
	.soon ul {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin: 1rem 0 0;
		padding: 0;
		list-style: none;
	}
	.soon li {
		padding: 0.6rem 1.1rem;
		border: 1.5px dashed var(--line);
		border-radius: var(--radius-small);
		color: var(--ink-faint);
		font-weight: 700;
	}
	@media (max-width: 760px) {
		.home {
			padding: 2rem 1rem;
		}
		h1 {
			font-size: 2.5rem;
		}
		.discipline {
			grid-template-columns: 1fr;
			padding: 1.5rem;
		}
		.preview {
			display: none;
		}
	}
</style>
