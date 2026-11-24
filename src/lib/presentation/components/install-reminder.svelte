<script lang="ts">
	import { m } from '../../paraglide/messages';

	/**
	 * The installation reminder (mock-up 12, CU18), on iPhone and iPad only: a sheet at the bottom
	 * of the screen. "Plus tard" (or Escape) closes it until the next opening.
	 */
	let { onlater }: { onlater: () => void } = $props();

	let dialog: HTMLDialogElement | undefined = $state();

	$effect(() => {
		dialog?.showModal();
	});
</script>

<dialog
	bind:this={dialog}
	class="sheet"
	aria-labelledby="install-title"
	oncancel={(event) => {
		event.preventDefault();
		onlater();
	}}
>
	<div class="content">
		<span class="handle" aria-hidden="true"></span>
		<h2 id="install-title">{m.install_title()}</h2>
		<p class="why">{m.install_why()}</p>
		<ol>
			<li>
				<span>{m.install_step_share_before()} <strong>{m.install_step_share()}</strong></span>
				<!-- The share icon of Safari. -->
				<svg class="share" viewBox="0 0 24 24" aria-hidden="true">
					<path d="M12 3v12M8 7l4-4 4 4M6 11H5v10h14V11h-1" />
				</svg>
			</li>
			<li>
				<span>{m.install_step_add_before()} <strong>{m.install_step_add()}</strong></span>
			</li>
			<li><span>{m.install_step_open()}</span></li>
		</ol>
		<button class="button button-quiet later" type="button" onclick={onlater}>
			{m.install_later()}
		</button>
	</div>
</dialog>

<style>
	.sheet {
		position: fixed;
		inset: auto 0 0 0;
		width: 100%;
		max-width: none;
		margin: 0;
		padding: 1rem 1.5rem calc(1.5rem + env(safe-area-inset-bottom));
		border: 0;
		border-top: 1px solid var(--line);
		border-radius: 1.5rem 1.5rem 0 0;
		background: var(--sheet);
		color: var(--ink);
		box-shadow: var(--shadow);
	}
	.sheet::backdrop {
		background: rgb(27 42 74 / 45%);
	}
	.content {
		display: flex;
		flex-direction: column;
		max-width: 46rem;
		margin: 0 auto;
	}
	.handle {
		align-self: center;
		width: 3rem;
		height: 0.3rem;
		margin-bottom: 1.25rem;
		border-radius: 999px;
		background: var(--line);
	}
	h2 {
		margin: 0 0 1rem;
		font-size: 1.6rem;
	}
	.why {
		margin: 0 0 1.25rem;
		color: var(--ink-muted);
		line-height: 1.5;
	}
	ol {
		display: grid;
		gap: 1rem;
		margin: 0 0 1.5rem;
		padding: 0;
		list-style: none;
		counter-reset: step;
	}
	li {
		display: flex;
		align-items: center;
		gap: 1rem;
		counter-increment: step;
	}
	li::before {
		content: counter(step);
		display: grid;
		place-items: center;
		flex: none;
		width: 2.4rem;
		height: 2.4rem;
		border-radius: 50%;
		background: var(--pen-wash);
		color: var(--pen);
		font-weight: 700;
	}
	.share {
		width: 1.5rem;
		height: 1.5rem;
		fill: none;
		stroke: var(--pen);
		stroke-width: 1.8;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.later {
		align-self: center;
	}
</style>
