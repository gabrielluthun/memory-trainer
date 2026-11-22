<script lang="ts">
	import { resolve } from '$app/paths';
	import { formatDuration } from '../format.ts';

	/**
	 * Result of a counted trial (mock-up 07, US01 CA3 and CA4): the score circled in red pen,
	 * both times to the hundredth. The corrected copy, digit by digit, comes with US11.
	 */
	let {
		score,
		itemCount,
		memorizationMs,
		recallMs,
		mode
	}: { score: number; itemCount: number; memorizationMs: number; recallMs: number; mode: string } =
		$props();
</script>

<section class="result" aria-labelledby="score-title">
	<h1 id="score-title" class="score">
		<svg class="circle" viewBox="0 0 320 130" aria-hidden="true" preserveAspectRatio="none">
			<path
				d="M40 30 C 110 -5, 300 0, 312 55 C 322 110, 150 132, 60 118 C -5 105, 0 45, 70 22"
				fill="none"
				stroke="var(--correction)"
				stroke-width="4"
				stroke-linecap="round"
			/>
		</svg>
		<span class="points">{score}</span>
		<span class="out-of">sur {itemCount}</span>
	</h1>

	<dl class="times">
		<div>
			<dt>Mémorisation</dt>
			<dd>{formatDuration(memorizationMs)}</dd>
		</div>
		<div>
			<dt>Rappel</dt>
			<dd>{formatDuration(recallMs)}</dd>
		</div>
	</dl>

	<span class="badge">{mode === 'standard' ? 'Standard' : 'Personnalisé'}</span>

	<div class="actions">
		<a class="button button-secondary" href={resolve('/')}>Accueil</a>
		<a class="button button-primary" href={resolve('/train/numbers')}>
			<span aria-hidden="true">▶</span> Rejouer
		</a>
	</div>
</section>

<style>
	.result {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 2.5rem;
		padding: 3rem 2.5rem;
		max-width: 80rem;
	}
	.score {
		position: relative;
		display: flex;
		align-items: baseline;
		gap: 0.6rem;
		padding: 1.1rem 2.4rem 1.4rem 2.2rem;
		color: var(--correction);
	}
	.circle {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}
	.points {
		font-family: var(--font-hand);
		font-size: 5rem;
		line-height: 1;
	}
	.out-of {
		font-size: 2.2rem;
		font-weight: 700;
	}
	.times {
		display: flex;
		gap: 3rem;
		margin: 0;
	}
	.times dt {
		color: var(--ink-muted);
	}
	.times dd {
		margin: 0.25rem 0 0;
		font-size: 2.6rem;
		font-weight: 700;
	}
	.actions {
		display: flex;
		gap: 1rem;
		margin-left: auto;
	}
	@media (max-width: 760px) {
		.result {
			flex-direction: column;
			align-items: flex-start;
			gap: 1.5rem;
			padding: 2rem 1rem;
		}
		.actions {
			margin-left: 0;
		}
	}
</style>
