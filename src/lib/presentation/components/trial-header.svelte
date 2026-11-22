<script lang="ts">
	import type { Snippet } from 'svelte';

	type Step = 'paused-before-memorization' | 'memorizing' | 'paused-before-recall' | 'recalling';

	let { phase, mode, status }: { phase: Step; mode: string; status: Snippet } = $props();

	const steps: { phase: Step; label: string }[] = [
		{ phase: 'paused-before-memorization', label: 'Pause' },
		{ phase: 'memorizing', label: 'Mémorisation' },
		{ phase: 'paused-before-recall', label: 'Pause' },
		{ phase: 'recalling', label: 'Rappel' }
	];
	const currentIndex = $derived(steps.findIndex((step) => step.phase === phase));
</script>

<header class="trial-header">
	<div class="title">
		<strong>Numbers</strong>
		<span class="badge">{mode === 'standard' ? 'Standard' : 'Personnalisé'}</span>
	</div>
	<ol class="steps" aria-label="Étapes de l'essai">
		{#each steps as step, index (index)}
			<li
				class:done={index < currentIndex}
				class:current={index === currentIndex}
				aria-current={index === currentIndex ? 'step' : undefined}
			>
				<span class="pill">
					{#if index < currentIndex}<span aria-hidden="true">✓</span>{/if}
					{step.label}
				</span>
			</li>
		{/each}
	</ol>
	<div class="status">{@render status()}</div>
</header>

<style>
	.trial-header {
		display: flex;
		align-items: center;
		gap: 2rem;
		padding: 0.9rem 2.5rem;
		background: var(--sheet);
		border-bottom: 1px solid var(--line);
	}
	.title {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-size: 1.4rem;
	}
	.steps {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		margin: 0 0 0 1.5rem;
		padding: 0;
		list-style: none;
		color: var(--ink-faint);
		font-weight: 700;
	}
	.steps li {
		display: flex;
		align-items: center;
	}
	/* The dash sits between the steps, outside the highlighted pill. */
	.steps li + li::before {
		content: '—';
		margin-right: 0.4rem;
		color: var(--line);
	}
	.pill {
		padding: 0.35rem 0.9rem;
		border-radius: 999px;
	}
	.steps li.done {
		color: var(--ink-muted);
	}
	.steps li.current .pill {
		background: var(--pen-wash);
		color: var(--pen);
	}
	.status {
		margin-left: auto;
		display: flex;
		align-items: baseline;
		gap: 1rem;
		color: var(--ink-muted);
	}
	@media (max-width: 900px) {
		.trial-header {
			flex-wrap: wrap;
			gap: 0.5rem 1rem;
			padding: 0.75rem 1rem;
		}
		.steps {
			order: 3;
			width: 100%;
			margin: 0;
			font-size: 0.9rem;
		}
		.pill {
			padding: 0.25rem 0.5rem;
		}
	}
</style>
