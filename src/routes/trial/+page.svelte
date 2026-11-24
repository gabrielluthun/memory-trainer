<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { getApp } from '#lib/app-container.ts';
	import AppHeader from '#lib/presentation/components/app-header.svelte';
	import type { AbandonChoice } from '#lib/application/trial-session.svelte.ts';
	import CorrectedCopy from '#lib/presentation/components/corrected-copy.svelte';
	import FateDialog from '#lib/presentation/components/fate-dialog.svelte';
	import MemorizationCarousel from '#lib/presentation/components/memorization-carousel.svelte';
	import RecallGrid from '#lib/presentation/components/recall-grid.svelte';
	import TrialHeader from '#lib/presentation/components/trial-header.svelte';
	import PauseCountdown from '#lib/presentation/components/pause-countdown.svelte';
	import TrialResult from '#lib/presentation/components/trial-result.svelte';
	import { formatClock, formatCountdown } from '#lib/presentation/format.ts';

	const session = getApp().session;
	const trial = $derived(session.current);

	// The stopwatch is read on the monotonic clock; this tick only refreshes the display.
	let now = $state(0);
	const memorizationElapsed = $derived.by(() => {
		void now;
		return trial?.phase === 'memorizing' ? trial.elapsedMs() : 0;
	});
	const recallRemaining = $derived.by(() => {
		void now;
		return trial?.phase === 'recalling' ? trial.format.recallMs - trial.elapsedMs() : 0;
	});
	const pauseRemaining = $derived.by(() => {
		void now;
		return trial?.phase === 'paused-before-memorization' || trial?.phase === 'paused-before-recall'
			? trial.countdown.remainingMs()
			: 0;
	});

	onMount(() => {
		if (!session.current) {
			void goto(resolve('/'));
			return;
		}
		let frame = requestAnimationFrame(function tick() {
			now = performance.now();
			frame = requestAnimationFrame(tick);
		});

		// Keep the screen on during the trial: 4 minutes of recall on a phone (technical constraints).
		let wakeLock: WakeLockSentinel | null = null;
		navigator.wakeLock
			?.request('screen')
			.then((lock) => (wakeLock = lock))
			.catch(() => {});

		// Tab hidden (another app, screen locked, tab closing): save now, not in 2 s (SEQ02).
		const saveWhenHidden = () => {
			if (document.visibilityState === 'hidden') session.saveNow();
		};
		document.addEventListener('visibilitychange', saveWhenHidden);

		return () => {
			cancelAnimationFrame(frame);
			void wakeLock?.release();
			document.removeEventListener('visibilitychange', saveWhenHidden);
		};
	});

	/** Abandon (CU05): during the first pause, nothing kept and back home (RG25); later, three choices. */
	function abandon() {
		session.abandon();
		if (!session.current) void goto(resolve('/'));
	}

	/** "Compter tel quel" shows the result; the two other choices go back home (RG23). */
	async function choose(choice: AbandonChoice) {
		await session.decide(choice);
		if (!session.current) await goto(resolve('/'));
	}

	// While the choice is pending, the steps stay on the phase the trial was abandoned in (mock-up 06).
	type Step = 'paused-before-memorization' | 'memorizing' | 'paused-before-recall' | 'recalling';
	let lastStep = $state<Step>('paused-before-memorization');
	$effect(() => {
		const phase = trial?.phase;
		if (phase && phase !== 'pending-decision' && phase !== 'completed') lastStep = phase;
	});

	function onkeydown(event: KeyboardEvent) {
		if (event.repeat && event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
		if (trial?.phase === 'paused-before-memorization' || trial?.phase === 'paused-before-recall') {
			if (event.key === 'Enter') {
				event.preventDefault();
				session.skipPause();
			}
		} else if (trial?.phase === 'memorizing') {
			const actions: Record<string, () => void> = {
				ArrowRight: () => session.next(),
				ArrowLeft: () => session.previous(),
				' ': () => session.toStart(),
				ArrowUp: () => session.toStart(),
				Enter: () => session.finishMemorization()
			};
			const action = actions[event.key];
			if (action) {
				event.preventDefault();
				action();
			}
		} else if (trial?.phase === 'recalling') {
			// The hidden field of the grid handles its own input (touch screens).
			if ((event.target as HTMLElement | null)?.dataset?.recallField !== undefined) {
				if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') event.preventDefault();
				else return;
			}
			const edits: Record<string, () => void> = {
				Backspace: () => session.backspace(),
				'+': () => session.insert(),
				'-': () => session.remove()
			};
			if (/^[0-9]$/.test(event.key)) {
				event.preventDefault();
				session.type(Number(event.key));
			} else if (edits[event.key]) {
				event.preventDefault();
				edits[event.key]();
			} else if (event.key === 'ArrowRight') {
				event.preventDefault();
				session.moveSelection(1);
			} else if (event.key === 'ArrowLeft') {
				event.preventDefault();
				session.moveSelection(-1);
			}
		}
	}
</script>

<svelte:head>
	<title>Essai de Numbers — memory-trainer</title>
</svelte:head>

<svelte:window {onkeydown} />

{#if trial?.phase === 'completed'}
	<AppHeader />
	<main class="result">
		<TrialResult
			score={trial.score}
			itemCount={trial.items.length}
			memorizationMs={trial.memorizationMs}
			recallMs={trial.recallMs}
			mode={trial.mode}
		/>
		<CorrectedCopy results={trial.results} pattern={trial.displayPattern} />
	</main>
{:else if trial}
	<TrialHeader
		phase={trial.phase === 'pending-decision' ? lastStep : trial.phase}
		mode={trial.mode}
	>
		{#snippet status()}
			{#if trial.phase === 'memorizing' || trial.phase === 'recalling'}
				<!-- On a phone, abandoning is the ✕ of the header (mock-ups 04 and 05). -->
				<button class="close" type="button" aria-label="Abandonner" onclick={abandon}>✕</button>
			{/if}
			{#if trial.phase === 'memorizing'}
				<span>Groupe <strong>{session.groupIndex + 1}</strong> sur {session.groupCount}</span>
				<span class="clock" data-testid="memorization-clock">
					{formatClock(memorizationElapsed)}
				</span>
				<span>/ {formatCountdown(trial.format.memorizationMs)}</span>
			{:else if trial.phase === 'recalling'}
				<span>Case <strong>{session.selected + 1}</strong> sur {trial.items.length}</span>
				<span class="clock" data-testid="recall-countdown">{formatCountdown(recallRemaining)}</span>
				<span>restantes</span>
			{:else if trial.phase === 'paused-before-memorization' || trial.phase === 'paused-before-recall'}
				<button class="button button-quiet" type="button" onclick={abandon}>Abandonner</button>
			{/if}
		{/snippet}
	</TrialHeader>

	<main class="trial">
		{#if trial.phase === 'memorizing'}
			<MemorizationCarousel
				items={trial.items}
				pattern={session.displayPattern}
				groupIndex={session.groupIndex}
			/>
			<p class="hint">La bande glisse sous le cadre, un groupe à la fois.</p>

			<div class="touch-nav" aria-label="Navigation">
				<button class="button button-secondary" type="button" onclick={() => session.toStart()}>
					Début
				</button>
				<button
					class="button button-secondary"
					type="button"
					aria-label="Groupe précédent"
					onclick={() => session.previous()}
				>
					←
				</button>
				<button
					class="button button-secondary"
					type="button"
					aria-label="Groupe suivant"
					onclick={() => session.next()}
				>
					→
				</button>
			</div>
			<div class="actions">
				<button class="button button-quiet abandon" type="button" onclick={abandon}>
					Abandonner
				</button>
				<button
					class="button button-primary finished"
					type="button"
					onclick={() => session.finishMemorization()}
				>
					Finished
				</button>
			</div>
			<p class="keys">
				<kbd>→</kbd> groupe suivant <kbd>←</kbd> précédent <kbd>Espace</kbd> début
				<kbd>Entrée</kbd> terminer
			</p>
		{:else if trial.phase === 'recalling'}
			<section class="sheet" aria-labelledby="recall-title">
				<div class="sheet-head">
					<h1 id="recall-title">Votre rappel</h1>
					<span>{trial.items.length} chiffres, dans l'ordre</span>
				</div>
				<RecallGrid
					answers={session.answers}
					selected={session.selected}
					pattern={session.displayPattern}
					onselect={(index: number) => session.select(index)}
					ontype={(digit: number) => session.type(digit)}
					onbackspace={() => session.backspace()}
					oninsert={() => session.insert()}
					onremove={() => session.remove()}
				/>
				<div class="sheet-actions">
					<!-- pointerdown keeps the focus in the hidden field: the touch keyboard stays open. -->
					<div class="edits">
						<button
							class="button button-secondary"
							type="button"
							aria-label="Insérer une case"
							onpointerdown={(event) => event.preventDefault()}
							onclick={() => session.insert()}
						>
							+ Insérer<span class="long"> une case</span>
						</button>
						<button
							class="button button-secondary"
							type="button"
							aria-label="Supprimer la case"
							onpointerdown={(event) => event.preventDefault()}
							onclick={() => session.remove()}
						>
							− Supprimer<span class="long"> la case</span>
						</button>
					</div>
					<div class="ends">
						<button class="button button-quiet abandon" type="button" onclick={abandon}>
							Abandonner
						</button>
						<button
							class="button button-primary finished"
							type="button"
							onclick={() => session.finishRecall()}
						>
							Finished
						</button>
					</div>
				</div>
			</section>
			<p class="keys">
				<kbd>0</kbd>–<kbd>9</kbd> saisir <kbd>⌫</kbd> effacer <kbd>+</kbd> insérer <kbd>−</kbd> supprimer
				· flèches ou clic pour changer de case
			</p>
		{:else if trial.phase === 'pending-decision'}
			<FateDialog
				title="Abandonner l'essai ?"
				intro="Ce choix est définitif : l'essai ne reprendra pas."
				countAsIsHint="Corrigé avec les réponses déjà saisies."
				onchoose={choose}
			/>
		{:else if trial.countdown.durationMs > 0}
			<!-- A 0 s pause shows nothing: the next phase starts directly (US23 CA4). -->
			<PauseCountdown
				next={trial.phase === 'paused-before-memorization' ? 'memorization' : 'recall'}
				remainingMs={pauseRemaining}
				durationMs={trial.countdown.durationMs}
				onskip={() => session.skipPause()}
			/>
		{/if}
	</main>
{/if}

<style>
	.result {
		max-width: 110rem;
		margin: 0 auto;
		padding: 0 2.5rem 3rem;
	}
	.trial {
		padding: 3rem 2.5rem;
		max-width: 110rem;
		margin: 0 auto;
	}
	.clock {
		color: var(--ink);
		font-size: 2.6rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}
	.hint {
		text-align: center;
		color: var(--ink-muted);
	}
	.actions {
		display: flex;
		justify-content: center;
		gap: 2rem;
		margin-top: 6rem;
	}
	.finished {
		min-width: 20rem;
		min-height: 4.25rem;
		font-size: 1.4rem;
	}
	.keys {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		align-items: center;
		gap: 0.5rem;
		margin-top: 2rem;
		color: var(--ink-muted);
	}
	.touch-nav {
		display: none;
	}
	.sheet {
		padding: 2.5rem 2.75rem;
		background: var(--sheet);
		border: 1px solid var(--line);
		border-radius: 1.25rem;
		box-shadow: var(--shadow);
	}
	.sheet-head {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		margin-bottom: 1.75rem;
		color: var(--ink-muted);
	}
	.sheet-head h1 {
		color: var(--ink);
		font-size: 1.3rem;
	}
	.sheet-actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
		margin-top: 2rem;
		padding-top: 2rem;
		border-top: 1px solid var(--line);
	}
	.edits,
	.ends {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	.close {
		display: none;
		padding: 0.25rem 0.5rem;
		border: none;
		background: none;
		color: var(--ink-muted);
		font-size: 1.6rem;
		cursor: pointer;
	}
	/* Touch screens: navigation buttons within thumb reach (wireframes). */
	@media (pointer: coarse) {
		.touch-nav {
			display: grid;
			grid-template-columns: 1fr 1fr 1fr;
			gap: 0.75rem;
			margin-top: 3rem;
		}
		.actions {
			margin-top: 1rem;
		}
		.finished {
			width: 100%;
			min-width: 0;
		}
		.keys {
			display: none;
		}
	}
	@media (max-width: 760px) {
		.trial {
			padding: 1.5rem 1rem;
		}
		.result {
			padding: 0 1rem 2rem;
		}
		.clock {
			font-size: 1.6rem;
		}
		.sheet {
			padding: 1.25rem 1rem;
		}
		/* On a phone, abandoning moves to the ✕ of the header (mock-ups 04 and 05). */
		.abandon {
			display: none;
		}
		.close {
			display: inline-block;
			margin-right: auto;
		}
		/* Mock-up 05 on a phone: two wide buttons, short labels. */
		.edits {
			flex: 1 1 100%;
		}
		.edits .button {
			flex: 1 1 0;
		}
		.long {
			display: none;
		}
	}
</style>
