<script lang="ts">
	/**
	 * A strip of groups sliding under a fixed frame (wireframes, mock-up 04): the group in the frame
	 * is the current one, its neighbours stay readable and fade on the edges.
	 */
	import {
		patternSize,
		splitGroup,
		type DisplayPattern
	} from '../../domain/navigation/display-pattern';
	import { m } from '../../paraglide/messages';

	let {
		items,
		pattern,
		groupIndex
	}: { items: number[]; pattern: DisplayPattern; groupIndex: number } = $props();

	// Each group is cut as the display pattern says: "2 3" shows "42 791" (RG11).
	const groupSize = $derived(patternSize(pattern));
	const groups = $derived(
		Array.from({ length: Math.ceil(items.length / groupSize) }, (_, index) =>
			splitGroup(items.slice(index * groupSize, (index + 1) * groupSize), pattern)
				.map((subgroup) => subgroup.join(''))
				.join(' ')
		)
	);
	// Characters shown in the widest group, spaces between subgroups included.
	const width = $derived(groupSize + pattern.length - 1);
</script>

<div class="carousel" style:--size={width} style:--index={groupIndex}>
	<div class="frame" aria-hidden="true"></div>
	<ol class="track" aria-hidden="true">
		{#each groups as group, index (index)}
			<li class:current={index === groupIndex}>{group}</li>
		{/each}
	</ol>
	<p class="visually-hidden" aria-live="polite">
		{m.trial_group_announcement({
			number: groupIndex + 1,
			digits: groups[groupIndex]?.replaceAll(' ', '').split('').join(' ') ?? ''
		})}
	</p>
</div>

<style>
	.carousel {
		/* Width of one group: its digits plus some air, in the digit font. */
		--group: calc(var(--size) * 1ch + 1.2ch);
		--gap: 0.6ch;
		position: relative;
		overflow: hidden;
		padding: 2.5rem 0;
		font-family: var(--font-digits);
		font-weight: 700;
		font-size: clamp(3.5rem, 9vw, 7rem);
		line-height: 1;
		mask-image: linear-gradient(90deg, transparent, #000 25%, #000 75%, transparent);
	}
	.frame {
		position: absolute;
		top: 50%;
		left: 50%;
		width: var(--group);
		height: 1.7em;
		transform: translate(-50%, -50%);
		border: 0.06em solid var(--pen);
		border-radius: 0.14em;
		background: var(--pen-wash);
	}
	.track {
		position: relative;
		display: flex;
		gap: var(--gap);
		margin: 0;
		padding: 0;
		list-style: none;
		/* Starts at the centre of the carousel, then slides so the current group sits under the frame. */
		margin-left: 50%;
		transform: translateX(calc(var(--group) / -2 - var(--index) * (var(--group) + var(--gap))));
		width: max-content;
		transition: transform 140ms ease-out;
	}
	.track li {
		flex: 0 0 var(--group);
		text-align: center;
		letter-spacing: 0.08em;
		white-space: pre;
		color: var(--ink-faint);
	}
	.track li.current {
		color: var(--ink);
	}
</style>
