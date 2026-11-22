<script lang="ts">
	/**
	 * Preparation pause (mock-up 03, US23): only the countdown is shown, the digits stay hidden.
	 * "Commencer maintenant" (or Enter) cuts the pause short.
	 */
	let {
		next,
		remainingMs,
		durationMs,
		onskip
	}: {
		next: 'memorization' | 'recall';
		remainingMs: number;
		durationMs: number;
		onskip: () => void;
	} = $props();

	const seconds = $derived(Math.ceil(remainingMs / 1_000));
	const progress = $derived(durationMs > 0 ? remainingMs / durationMs : 0);
	const circumference = 2 * Math.PI * 90;
</script>

<section class="pause" aria-labelledby="pause-title">
	<h1 id="pause-title">
		{next === 'memorization' ? 'La mémorisation commence dans' : 'Le rappel commence dans'}
	</h1>

	<div class="ring" role="timer" aria-live="polite" aria-label="{seconds} secondes">
		<svg viewBox="0 0 200 200" aria-hidden="true">
			<circle class="ring-background" cx="100" cy="100" r="90" />
			<circle
				class="left"
				cx="100"
				cy="100"
				r="90"
				stroke-dasharray={circumference}
				stroke-dashoffset={circumference * (1 - progress)}
			/>
		</svg>
		<strong>{seconds}</strong>
	</div>

	<p class="hint">
		{next === 'memorization'
			? 'Les chiffres sont cachés jusqu’au départ du chronomètre.'
			: 'Le rappel commence au départ du chronomètre.'}
	</p>

	<button class="button button-secondary skip" type="button" onclick={onskip}>
		Commencer maintenant
	</button>
</section>

<style>
	.pause {
		display: grid;
		justify-items: center;
		gap: 2rem;
		padding: 4rem 1rem;
	}
	h1 {
		color: var(--ink-muted);
		font-size: 2rem;
		font-weight: 500;
		text-align: center;
	}
	.ring {
		position: relative;
		display: grid;
		place-items: center;
		width: min(20rem, 70vw);
		aspect-ratio: 1;
	}
	svg {
		position: absolute;
		inset: 0;
		transform: rotate(-90deg);
	}
	circle {
		fill: none;
		stroke-width: 10;
	}
	.ring-background {
		stroke: var(--line);
	}
	.left {
		stroke: var(--pen);
		stroke-linecap: round;
		transition: stroke-dashoffset 120ms linear;
	}
	strong {
		font-size: clamp(5rem, 18vw, 9rem);
		line-height: 1;
	}
	.hint {
		margin: 0;
		color: var(--ink-muted);
		text-align: center;
	}
	.skip {
		min-width: 22rem;
		min-height: 4.25rem;
		font-size: 1.3rem;
	}
	@media (max-width: 760px) {
		.skip {
			width: 100%;
			min-width: 0;
		}
	}
</style>
