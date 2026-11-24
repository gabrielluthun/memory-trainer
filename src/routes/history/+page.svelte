<script lang="ts">
	import { resolve } from '$app/paths';
	import { getApp } from '#lib/app-container.ts';
	import type { HistoryFilter } from '#lib/application/history-query.ts';
	import type { TrialSummary } from '#lib/application/ports.ts';
	import AppHeader from '#lib/presentation/components/app-header.svelte';
	import { formatDuration, formatTrialDate } from '#lib/presentation/format.ts';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';

	/**
	 * History (mock-up 08, US12, CU07): every trial, most recent first, read on the device.
	 * One list of links: a table on a computer, cards on a phone. Nothing here can change or
	 * delete a trial (RG18).
	 */
	const app = getApp();

	// Numbers by default, as on mock-up 08; "Toutes les disciplines" is cut short on a phone.
	let discipline = $state<HistoryFilter['discipline']>('numbers');
	let mode = $state<HistoryFilter['mode']>('all');
	let trials = $state<TrialSummary[] | null>(null);
	let hasAny = $state(false);
	const now = new Date();

	// Both lists arrive together: an empty device and empty filters say different things (CU07 1a).
	$effect(() => {
		const filter: HistoryFilter = { discipline, mode };
		void Promise.all([
			app.history.list(filter),
			app.history.list({ discipline: 'all', mode: 'all' })
		]).then(([listed, all]) => {
			hasAny = all.length > 0;
			trials = listed;
		});
	});

	// Excluded trials: labels of mock-up 08; their score and time show as "—" (RG23, RG24).
	const statusLabels: Record<string, () => string> = {
		completed: m.status_completed,
		abandoned: m.status_abandoned,
		external_error: m.status_external_error
	};
</script>

<svelte:head>
	<title>{m.history()} — memory-trainer</title>
</svelte:head>

<AppHeader />

<main class="history">
	<div class="head">
		<h1>{m.history()}</h1>
		<div class="filters">
			<select aria-label={m.history_discipline()} bind:value={discipline}>
				<option value="all">{m.history_all_disciplines()}</option>
				<option value="numbers">Numbers</option>
			</select>
			<select aria-label={m.history_mode()} bind:value={mode}>
				<option value="all">{m.history_all_modes()}</option>
				<option value="standard">{m.mode_standard()}</option>
				<option value="custom">{m.mode_custom()}</option>
			</select>
		</div>
	</div>

	{#if trials !== null}
		{#if !hasAny}
			<div class="empty">
				<p>{m.history_empty()}</p>
				<a class="button button-primary" href={resolve('/train/numbers')}>
					<span aria-hidden="true">▶</span>
					{m.launch_trial()}
				</a>
			</div>
		{:else if trials.length === 0}
			<p class="empty">{m.history_no_match()}</p>
		{:else}
			<section class="sheet">
				<div class="columns" aria-hidden="true">
					<span>{m.history_date()}</span><span>{m.history_mode()}</span><span>
						{m.history_score()}
					</span><span>{m.step_memorization()}</span><span>{m.history_status()}</span>
				</div>
				<ol class="trials" aria-label={m.history_trials()}>
					{#each trials as trial (trial.id)}
						{@const date = formatTrialDate(trial.startedAt, now, getLocale())}
						<li>
							<a class="trial" href={resolve('/history/[id]', { id: trial.id })}>
								<span class="date"><strong>{date.day}</strong> {date.time}</span>
								<span class="mode">
									<span class="badge" class:custom={trial.mode === 'custom'}>
										{trial.mode === 'custom'
											? m.history_custom({ count: trial.itemCount })
											: m.mode_standard()}
									</span>
								</span>
								<span class="score">
									{#if trial.score === null}
										<span class="none">—</span>
									{:else}
										<span class="points">{trial.score} / {trial.itemCount}</span>
										<span class="gauge" aria-hidden="true">
											<span style:width="{(100 * trial.score) / trial.itemCount}%"></span>
										</span>
									{/if}
								</span>
								<span class="memorization">
									{trial.score === null || trial.memorizationMs === null
										? '—'
										: formatDuration(trial.memorizationMs, getLocale())}
								</span>
								<!-- Refused by the database (ES07): never sent, shown instead of its status (SEQ05). -->
								{#if trial.rejected}
									<span class="status status-rejected">{m.status_rejected()}</span>
								{:else}
									<span class="status status-{trial.status}">
										{statusLabels[trial.status]?.() ?? trial.status}
									</span>
								{/if}
								<span class="chevron" aria-hidden="true">›</span>
							</a>
						</li>
					{/each}
				</ol>
			</section>
		{/if}
	{/if}
</main>

<style>
	.history {
		max-width: 110rem;
		margin: 0 auto;
		padding: 3rem 2.5rem;
	}
	.head {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: center;
		gap: 1.5rem;
		margin-bottom: 2rem;
	}
	h1 {
		margin: 0;
		font-size: 3rem;
	}
	.filters {
		display: flex;
		gap: 1rem;
	}
	.filters select {
		min-height: 3.25rem;
		padding: 0 1.25rem;
		border: 1.5px solid var(--line);
		border-radius: var(--radius-small);
		background: var(--sheet);
		color: var(--ink);
		font: inherit;
		font-weight: 700;
	}
	.empty {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 1.25rem;
		color: var(--ink-muted);
		font-size: 1.2rem;
	}
	.sheet {
		padding: 0.5rem 1rem;
		background: var(--sheet);
		border: 1px solid var(--line);
		border-radius: 1.25rem;
	}
	.columns,
	.trial {
		display: grid;
		grid-template-columns: 1.3fr 1.3fr 1.3fr 1fr 1fr 2rem;
		align-items: center;
		gap: 1rem;
		padding: 1.1rem 1rem;
	}
	.columns {
		color: var(--ink-muted);
		font-weight: 700;
	}
	.trials {
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.trials li,
	.columns {
		border-bottom: 1px solid var(--line);
	}
	.trials li:last-child {
		border-bottom: none;
	}
	.trial {
		color: var(--ink);
		text-decoration: none;
	}
	.trial:hover {
		background: var(--paper);
	}
	.date {
		font-variant-numeric: tabular-nums;
		color: var(--ink-muted);
	}
	.date strong {
		color: var(--ink);
	}
	.badge.custom {
		border-color: transparent;
		background: color-mix(in srgb, var(--custom) 14%, transparent);
		color: var(--custom);
	}
	.score {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}
	.points {
		font-family: var(--font-digits);
		font-weight: 700;
		font-size: 1.3rem;
	}
	.gauge {
		width: 9rem;
		max-width: 100%;
		height: 0.3rem;
		border-radius: 1rem;
		background: var(--line);
		overflow: hidden;
	}
	.gauge span {
		display: block;
		height: 100%;
		background: var(--pen);
	}
	.none {
		color: var(--ink-muted);
	}
	.memorization {
		color: var(--ink-muted);
		font-family: var(--font-digits);
	}
	.status {
		justify-self: start;
		font-weight: 700;
	}
	.status-completed {
		color: var(--right);
	}
	.status-abandoned,
	.status-external_error,
	.status-rejected {
		padding: 0.15rem 0.6rem;
		border-radius: 0.4rem;
		font-size: 0.95rem;
	}
	.status-abandoned {
		border: 1.5px dashed var(--line);
		color: var(--ink-muted);
	}
	.status-external_error {
		background: color-mix(in srgb, var(--waiting) 14%, transparent);
		color: var(--waiting);
	}
	.status-rejected {
		background: var(--correction-wash);
		color: var(--correction);
	}
	.chevron {
		color: var(--ink-muted);
		font-size: 1.6rem;
		justify-self: end;
	}
	/* Mock-up 08 on a phone: cards with the score first, the date under it. */
	@media (max-width: 760px) {
		.history {
			padding: 1.5rem 1rem;
		}
		h1 {
			font-size: 1.8rem;
		}
		.filters {
			width: 100%;
		}
		.filters select {
			flex: 1 1 0;
			min-width: 0;
		}
		.sheet {
			padding: 0 1rem;
		}
		.columns,
		.chevron,
		.gauge,
		.status-completed,
		.badge:not(.custom) {
			display: none;
		}
		.trial {
			grid-template-columns: 1fr auto auto;
			grid-template-areas:
				'score mode memorization'
				'date  mode memorization';
			gap: 0.3rem 1rem;
			padding: 1.25rem 0.25rem;
		}
		.score {
			grid-area: score;
		}
		.date {
			grid-area: date;
		}
		.mode {
			grid-area: mode;
		}
		.memorization {
			grid-area: memorization;
		}
		.status {
			grid-area: mode;
		}
	}
</style>
