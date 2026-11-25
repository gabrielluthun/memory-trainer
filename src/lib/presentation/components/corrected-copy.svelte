<script lang="ts">
	/**
	 * Corrected copy (mock-up 07, US11): each expected digit next to the answer given (RG19).
	 * Right in blue pen; wrong answer struck out with the right digit in red; blank cell dashed,
	 * filled in red. Each row gets its mark in the margin, computed from the correction (RG12).
	 */
	import type { ItemResult } from '../../domain/disciplines/discipline';
	import { isSubgroupStart, type DisplayPattern } from '../../domain/navigation/display-pattern';
	import { m } from '../../paraglide/messages';
	import { rowMark, rowSizeFor, rowsOf } from '../grid-rows';

	let { results, pattern }: { results: ItemResult<number, number>[]; pattern: DisplayPattern } =
		$props();

	let width = $state(1200);
	const rowSize = $derived(rowSizeFor(width, pattern));
	const rows = $derived(rowsOf(results.length, rowSize));

	function label({ position, expected, answer, correct }: ItemResult<number, number>): string {
		if (correct) return m.copy_cell_right({ position, answer: answer ?? '' });
		if (answer === null) return m.copy_cell_blank({ position, expected });
		return m.copy_cell_wrong({ position, answer, expected });
	}
</script>

<svelte:window bind:innerWidth={width} />

<section class="sheet" aria-labelledby="copy-title">
	<div class="sheet-head">
		<h2 id="copy-title">{m.copy_title()}</h2>
		<ul class="legend" aria-label={m.copy_legend()}>
			<li><span class="sample">7</span> {m.copy_legend_right()}</li>
			<li><span class="sample wrong"><s>2</s></span> {m.copy_legend_wrong()}</li>
			<li><span class="sample blank"></span> {m.copy_legend_blank()}</li>
			<li><span class="mark">17<small>/20</small></span> {m.copy_legend_row_mark()}</li>
		</ul>
	</div>

	<div class="rows">
		{#each rows as row, rowIndex (rowIndex)}
			{@const mark = rowMark(results, row)}
			<div class="row">
				<ol class="cells" start={row[0] + 1}>
					{#each row as index (index)}
						{@const result = results[index]}
						<li
							class="cell"
							class:wrong={!result.correct && result.answer !== null}
							class:blank={result.answer === null}
							class:group-start={isSubgroupStart(index, pattern) && index % rowSize !== 0}
							aria-label={label(result)}
						>
							<span class="position" aria-hidden="true">{result.position}</span>
							{#if result.correct}
								<span class="answer" aria-hidden="true">{result.answer}</span>
							{:else}
								{#if result.answer !== null}<s class="struck" aria-hidden="true">
										{result.answer}
									</s>{/if}
								<span class="expected" aria-hidden="true">{result.expected}</span>
							{/if}
						</li>
					{/each}
				</ol>
				<span
					class="mark"
					aria-label={m.copy_row_mark({ row: rowIndex + 1, right: mark.right, total: mark.total })}
				>
					{mark.right}<small>/{mark.total}</small>
				</span>
			</div>
		{/each}
	</div>
</section>

<style>
	.sheet {
		padding: 2.5rem 2.75rem;
		background: var(--sheet);
		border: 1px solid var(--line);
		border-radius: 1.25rem;
		box-shadow: var(--shadow);
	}
	.sheet-head {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1.75rem;
	}
	.sheet-head h2 {
		margin: 0;
		color: var(--ink);
		font-size: 1.3rem;
	}
	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: 1.5rem;
		margin: 0;
		padding: 0;
		list-style: none;
		color: var(--ink-muted);
	}
	.legend li {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.sample {
		display: inline-grid;
		place-items: center;
		width: 2.6rem;
		height: 1.9rem;
		border: 1.5px solid var(--line);
		border-radius: var(--radius-small);
		color: var(--pen);
		font-family: var(--font-digits);
	}
	.sample.wrong {
		border-color: var(--correction);
		background: var(--correction-wash);
		color: var(--ink-faint);
	}
	.sample.blank {
		border: 1.5px dashed var(--correction);
		background: var(--correction-wash);
	}
	.rows {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}
	.row {
		display: flex;
		align-items: center;
		gap: 1rem;
	}
	.cells {
		display: flex;
		flex: 1 1 auto;
		gap: 0.45rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.cell {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.2rem;
		flex: 1 1 0;
		min-width: 0;
		max-width: 4.2rem;
		aspect-ratio: 3 / 4;
		border: 1.5px solid var(--line);
		border-radius: 0.6rem;
		color: var(--pen);
		font-family: var(--font-digits);
		font-size: clamp(1.3rem, 2.6vw, 2.3rem);
		/* Room for the position number above the digit (mock-up 07). */
		padding-top: 0.9rem;
	}
	.cell.group-start {
		margin-left: 0.9rem;
	}
	.cell.wrong {
		border-color: var(--correction);
		background: var(--correction-wash);
	}
	.cell.blank {
		border: 1.5px dashed var(--correction);
		background: var(--correction-wash);
	}
	.position {
		position: absolute;
		top: 0.25rem;
		left: 0.4rem;
		color: var(--ink-faint);
		font-family: var(--font-ui);
		font-size: 0.65rem;
	}
	.struck {
		color: var(--ink-faint);
		font-size: 0.6em;
		text-decoration-color: var(--correction);
		text-decoration-thickness: 2px;
	}
	.expected,
	.mark {
		color: var(--correction);
		font-family: var(--font-hand);
	}
	.mark {
		flex: 0 0 4.5rem;
		font-size: 1.6rem;
		white-space: nowrap;
	}
	.mark small {
		font-size: 0.6em;
	}
	@media (max-width: 760px) {
		.sheet {
			padding: 1.25rem 1rem;
		}
		/* Mock-up 07 on a phone: no legend, no position numbers, a narrower margin. */
		.legend,
		.position {
			display: none;
		}
		.cell {
			padding-top: 0;
		}
		.cells {
			gap: 0.3rem;
		}
		.cell.group-start {
			margin-left: 0.5rem;
		}
		.mark {
			flex-basis: 2.75rem;
			font-size: 1.1rem;
		}
	}
</style>
