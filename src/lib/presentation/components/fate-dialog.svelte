<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { AbandonChoice } from '../../application/trial-session.svelte';

	/**
	 * The three choices of RG23 (mock-ups 06 and 09), in a modal window with no "Annuler" and no
	 * Escape: they are the only way out (decision CU05).
	 */
	let {
		title,
		intro,
		countAsIsHint,
		badge,
		onchoose
	}: {
		title: string;
		intro: string;
		countAsIsHint: string;
		badge?: Snippet;
		onchoose: (choice: AbandonChoice) => void;
	} = $props();

	let dialog: HTMLDialogElement | undefined = $state();
	let chosen = $state(false);

	$effect(() => {
		dialog?.showModal();
	});

	const options: { choice: AbandonChoice; label: string; hint: () => string; tone: string }[] = [
		{
			choice: 'keep-out-of-stats',
			label: 'Garder hors statistiques',
			hint: () => "Visible dans l'historique, sans compter dans les statistiques.",
			tone: 'neutral'
		},
		{ choice: 'count-as-is', label: 'Compter tel quel', hint: () => countAsIsHint, tone: 'right' },
		{
			choice: 'discard',
			label: 'Ne pas garder',
			hint: () => "Rien n'est enregistré.",
			tone: 'wrong'
		}
	];

	function choose(choice: AbandonChoice) {
		if (chosen) return;
		chosen = true;
		onchoose(choice);
	}
</script>

<dialog
	bind:this={dialog}
	aria-labelledby="fate-title"
	oncancel={(event) => event.preventDefault()}
>
	{#if badge}{@render badge()}{/if}
	<h2 id="fate-title">{title}</h2>
	<p class="intro">{intro}</p>
	<div class="options">
		{#each options as option (option.choice)}
			<button type="button" class="option" disabled={chosen} onclick={() => choose(option.choice)}>
				<span class="dot {option.tone}" aria-hidden="true"></span>
				<span class="text">
					<strong>{option.label}</strong>
					<span class="hint">{option.hint()}</span>
				</span>
			</button>
		{/each}
	</div>
</dialog>

<style>
	dialog {
		width: min(36rem, calc(100vw - 2rem));
		padding: 2.25rem;
		border: 1px solid var(--line);
		border-radius: 1.25rem;
		background: var(--sheet);
		color: var(--ink);
		box-shadow: var(--shadow);
	}
	dialog::backdrop {
		background: color-mix(in srgb, var(--ink) 40%, transparent);
	}
	h2 {
		margin: 0;
		font-size: 1.6rem;
	}
	.intro {
		margin: 0.9rem 0 1.25rem;
		color: var(--ink-muted);
	}
	.options {
		display: grid;
		gap: 1rem;
	}
	.option {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		padding: 1.1rem 1.25rem;
		border: 1.5px solid var(--line);
		border-radius: 0.9rem;
		background: var(--sheet);
		color: var(--ink);
		font: inherit;
		text-align: left;
		cursor: pointer;
	}
	.option:hover:not(:disabled) {
		border-color: var(--pen);
	}
	.option:disabled {
		cursor: wait;
	}
	.dot {
		flex: 0 0 auto;
		width: 0.9rem;
		height: 0.9rem;
		margin-top: 0.35rem;
		border-radius: 50%;
		background: var(--ink-faint);
	}
	.dot.right {
		background: var(--right);
	}
	.dot.wrong {
		background: var(--correction);
	}
	.text {
		display: grid;
		gap: 0.3rem;
	}
	.text strong {
		font-size: 1.15rem;
	}
	.hint {
		color: var(--ink-muted);
	}
	@media (max-width: 760px) {
		dialog {
			padding: 1.5rem 1.25rem;
		}
	}
</style>
