<script lang="ts">
	/**
	 * Recall grid (mock-up 05): one cell per digit, rows cut on whole groups, the selected cell
	 * in blue pen. Digits come from the keyboard or, on touch screens, from the system numeric
	 * keyboard through a hidden field (wireframes).
	 */
	import {
		isSubgroupStart,
		patternSize,
		type DisplayPattern
	} from '../../domain/navigation/display-pattern';

	let {
		answers,
		selected,
		pattern,
		onselect,
		ontype
	}: {
		answers: (number | null)[];
		selected: number;
		pattern: DisplayPattern;
		onselect: (index: number) => void;
		ontype: (digit: number) => void;
	} = $props();

	let width = $state(1200);
	let field: HTMLInputElement | undefined = $state();

	// About 20 cells per row on a computer, 10 on a phone, always cut on whole groups.
	const groupSize = $derived(patternSize(pattern));
	const rowSize = $derived(
		Math.max(groupSize, Math.floor((width < 760 ? 10 : 20) / groupSize) * groupSize)
	);
	const rows = $derived(
		Array.from({ length: Math.ceil(answers.length / rowSize) }, (_, row) =>
			Array.from(
				{ length: Math.min(rowSize, answers.length - row * rowSize) },
				(_, column) => row * rowSize + column
			)
		)
	);

	function choose(index: number) {
		onselect(index);
		field?.focus();
	}

	function oninput(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		for (const char of input.value) {
			if (char >= '0' && char <= '9') ontype(Number(char));
		}
		input.value = '';
	}
</script>

<svelte:window bind:innerWidth={width} />

<div class="grid" style:--row={rowSize}>
	{#each rows as row, rowIndex (rowIndex)}
		<div class="row">
			{#each row as index (index)}
				<button
					type="button"
					class="cell"
					class:selected={index === selected}
					class:group-start={isSubgroupStart(index, pattern) && index % rowSize !== 0}
					aria-label="Case {index + 1}, {answers[index] ?? 'vide'}"
					aria-pressed={index === selected}
					onclick={() => choose(index)}
				>
					{answers[index] ?? ''}
					{#if index === selected && answers[index] === null}<span class="caret" aria-hidden="true"
						></span>{/if}
				</button>
			{/each}
		</div>
	{/each}
</div>

<input
	bind:this={field}
	class="visually-hidden"
	type="text"
	inputmode="numeric"
	autocomplete="off"
	aria-label="Saisir un chiffre"
	data-recall-field
	{oninput}
/>

<style>
	.grid {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}
	.row {
		display: flex;
		gap: 0.45rem;
	}
	.cell {
		position: relative;
		flex: 1 1 0;
		min-width: 0;
		max-width: 4.2rem;
		aspect-ratio: 3 / 4;
		border: 1.5px solid var(--line);
		border-radius: 0.6rem;
		background: var(--sheet);
		color: var(--pen);
		font-family: var(--font-digits);
		font-size: clamp(1.3rem, 2.6vw, 2.3rem);
		cursor: pointer;
	}
	.cell.group-start {
		margin-left: 0.9rem;
	}
	.cell.selected {
		border: 3px solid var(--pen);
		background: var(--pen-wash);
		box-shadow: 0 0 0 4px color-mix(in srgb, var(--pen) 18%, transparent);
	}
	.caret {
		position: absolute;
		left: 50%;
		top: 25%;
		height: 50%;
		border-left: 2px solid var(--pen);
		animation: blink 1s steps(1) infinite;
	}
	@keyframes blink {
		50% {
			opacity: 0;
		}
	}
	@media (max-width: 760px) {
		.row {
			gap: 0.3rem;
		}
		.cell.group-start {
			margin-left: 0.5rem;
		}
	}
</style>
