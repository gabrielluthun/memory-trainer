<script lang="ts">
	/** Choice of a preparation pause: 0, 5, 10 or 20 s (RG25, mock-up 02). */
	let {
		label,
		valueMs,
		onchange
	}: { label: string; valueMs: number; onchange: (valueMs: number) => void } = $props();

	const durations = [0, 5_000, 10_000, 20_000];
	const id = $props.id();
</script>

<div class="picker">
	<span id="{id}-label" class="label">{label}</span>
	<div class="choices" role="radiogroup" aria-labelledby="{id}-label">
		{#each durations as duration (duration)}
			<button
				type="button"
				role="radio"
				aria-checked={duration === valueMs}
				class:selected={duration === valueMs}
				onclick={() => onchange(duration)}
			>
				{duration / 1_000} s
			</button>
		{/each}
	</div>
</div>

<style>
	.label {
		display: block;
		margin-bottom: 0.75rem;
		font-weight: 700;
		font-size: 1.1rem;
	}
	.choices {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
	}
	button {
		min-width: 4.75rem;
		min-height: 3.25rem;
		border: 1.5px solid var(--line);
		border-radius: var(--radius-small);
		background: var(--sheet);
		color: var(--ink-muted);
		font-family: var(--font-digits);
		font-weight: 700;
		font-size: 1.1rem;
		cursor: pointer;
	}
	button.selected {
		border-color: var(--pen);
		background: var(--pen-wash);
		color: var(--pen);
	}
</style>
