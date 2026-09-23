<script lang="ts">
	import { onMount } from 'svelte';
	import { prefersReducedMotion } from 'svelte/motion';
	import { fade, scale } from 'svelte/transition';
	import {
		TOTAL_SLOTS,
		buildNodeRanges,
		crc16,
		keySlot,
		slotToNode
	} from '$lib/utils/redis-cluster';

	const NODE_COLORS = ['#ffa86a', '#6fb1ff', '#c79bff', '#6fd49a', '#ff8fa8', '#e3cf6a'];

	// Same cap as findAnchors, so an absurd dial setting can't hang a render.
	const LIMIT = 100_000;

	interface Candidate {
		n: number;
		tag: string;
		crc: number;
		slot: number;
		node: number;
		kept: boolean;
		// Which seat on its node a kept integer took, counting from zero.
		seat: number;
	}

	// Five by four is where the walk starts wasting integers, which is the part
	// worth seeing; smaller shapes keep almost everything.
	let nodeCount = $state(5);
	let perNode = $state(4);
	let cursor = $state(0);
	let root: HTMLElement | undefined = $state();

	let timer: ReturnType<typeof setTimeout> | undefined;
	let autoplayed = false;

	const ranges = $derived(buildNodeRanges(nodeCount));
	const nodeIndexes = $derived([...Array(nodeCount).keys()]);
	const seatIndexes = $derived([...Array(perNode).keys()]);

	// findAnchors, unrolled so every integer it looked at is on the record,
	// including the ones it threw away.
	const walk = $derived.by(() => {
		const wanted = nodeCount * perNode;
		const filled = new Array<number>(nodeCount).fill(0);
		const out: Candidate[] = [];
		let kept = 0;

		for (let n = 0; n < LIMIT && kept < wanted; n++) {
			const tag = `routing:v1:${n}`;
			const slot = keySlot(tag);
			const node = slotToNode(slot, ranges);
			const room = filled[node] < perNode;

			out.push({ n, tag, crc: crc16(tag), slot, node, kept: room, seat: filled[node] });
			if (room) {
				filled[node]++;
				kept++;
			}
		}

		return out;
	});

	const seen = $derived(walk.slice(0, cursor));
	const current = $derived(cursor > 0 ? walk[cursor - 1] : undefined);
	const done = $derived(cursor >= walk.length);

	const anchors = $derived(seen.filter((c) => c.kept));
	const skipped = $derived(seen.length - anchors.length);
	const totalSkipped = $derived(walk.filter((c) => !c.kept).length);

	// seats[node][seat] is the integer sitting there, once the walk reaches it.
	const seats = $derived.by(() => {
		const grid = nodeIndexes.map(() => new Array<number | undefined>(perNode).fill(undefined));
		for (const c of anchors) grid[c.node][c.seat] = c.n;

		return grid;
	});

	// How full the candidate's node was when it got there, for the verdict line.
	const verdict = $derived.by(() => {
		if (!current) return '';
		if (!current.kept) return `already has ${perNode}, skip`;

		return `seat ${current.seat + 1} of ${perNode}, keep`;
	});

	function pct(slot: number): string {
		return `${(slot / TOTAL_SLOTS) * 100}%`;
	}

	function color(node: number): string {
		return NODE_COLORS[node % NODE_COLORS.length];
	}

	function stop() {
		clearTimeout(timer);
		timer = undefined;
	}

	function step() {
		stop();
		cursor = done ? 0 : cursor + 1;
	}

	function finish() {
		stop();
		cursor = walk.length;
	}

	function play() {
		stop();
		cursor = 0;

		if (prefersReducedMotion.current) {
			cursor = walk.length;
			return;
		}

		// Long walks speed up so the whole thing fits in roughly ten seconds,
		// but never so fast a skip can't be read.
		const pace = Math.max(220, Math.min(750, 10_000 / walk.length));
		const tick = () => {
			if (cursor >= walk.length) return;
			cursor++;
			timer = setTimeout(tick, pace);
		};
		timer = setTimeout(tick, 400);
	}

	function redial() {
		// Dragging a slider shouldn't restart a ten second animation on every
		// notch, so a new shape lands on its finished answer.
		stop();
		cursor = walk.length;
	}

	onMount(() => {
		if (prefersReducedMotion.current) {
			cursor = walk.length;
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (!entry.isIntersecting || autoplayed) continue;
					autoplayed = true;
					play();
				}
			},
			{ threshold: 0.4 }
		);

		if (root) observer.observe(root);

		return () => {
			observer.disconnect();
			stop();
		};
	});
</script>

<figure class="walk" bind:this={root}>
	<div class="dials">
		<label class="dial">
			<span>primaries</span>
			<input type="range" min="2" max="6" step="1" bind:value={nodeCount} oninput={redial} />
			<span class="dial-value">{nodeCount}</span>
		</label>
		<label class="dial">
			<span>tags per primary</span>
			<input type="range" min="1" max="6" step="1" bind:value={perNode} oninput={redial} />
			<span class="dial-value">{perNode}</span>
		</label>
	</div>

	<div class="work" aria-live="polite">
		{#if current}
			<div class="line">
				<span class="op">n</span> = <strong>{current.n}</strong>
			</div>
			<div class="line">
				<span class="op">CRC16</span>("<span class="tag">{current.tag}</span>") = {current.crc}
			</div>
			<div class="line">
				{current.crc} <span class="op">mod</span>
				{TOTAL_SLOTS} = <span class="slot" style:color={color(current.node)}>slot {current.slot}</span>
			</div>
			<div class="line">
				slot {current.slot} &rarr;
				<span style:color={color(current.node)}>primary {current.node + 1}</span>
				&rarr;
				<span class:keep={current.kept} class:skip={!current.kept}>{verdict}</span>
			</div>
		{:else}
			<div class="line idle">n = 0, 1, 2, &hellip; until every primary has {perNode}</div>
		{/if}
	</div>

	<div class="ruler-wrap">
		<div class="ruler" aria-hidden="true">
			{#each ranges as range, i (i)}
				<div
					class="segment"
					style:width={pct(range.end - range.start + 1)}
					style:--node-color={color(i)}
				>
					<span>{i + 1}</span>
				</div>
			{/each}

			{#each anchors as c (c.n)}
				<span
					class="landed"
					style:left={pct(c.slot)}
					style:--node-color={color(c.node)}
					in:fade={{ duration: prefersReducedMotion.current ? 0 : 200 }}
				></span>
			{/each}

			{#if current}
				<span
					class="marker"
					class:missed={!current.kept}
					class:still={prefersReducedMotion.current}
					style:left={pct(current.slot)}
					style:--node-color={color(current.node)}
				></span>
			{/if}
		</div>
		<div class="ruler-ends">
			<span>slot 0</span>
			<span>{TOTAL_SLOTS - 1}</span>
		</div>
	</div>

	<ol class="tape" aria-label="Integers tried">
		{#each seen as c (c.n)}
			<li
				class="int"
				class:kept={c.kept}
				class:current={c === current}
				title="{c.tag} → slot {c.slot} → primary {c.node + 1}{c.kept ? '' : ' (full)'}"
				style:--node-color={color(c.node)}
				in:scale={{ duration: prefersReducedMotion.current ? 0 : 180, start: 0.6 }}
			>
				{c.n}
			</li>
		{/each}
	</ol>

	<div class="bins">
		{#each nodeIndexes as node (node)}
			<div class="bin" style:--node-color={color(node)}>
				<span class="bin-title">primary {node + 1}</span>
				<span class="bin-range">{ranges[node].start}&ndash;{ranges[node].end}</span>
				<div class="seats">
					{#each seatIndexes as seat (seat)}
						{@const n = seats[node][seat]}
						<span class="seat" class:filled={n !== undefined}>
							{#if n !== undefined}
								<span in:scale={{ duration: prefersReducedMotion.current ? 0 : 220, start: 0.5 }}>
									{n}
								</span>
							{/if}
						</span>
					{/each}
				</div>
			</div>
		{/each}
	</div>

	<div class="readout">
		<span class="step">
			{seen.length}/{walk.length} tried &middot; {skipped} skipped
		</span>
		<span class="kept-count">
			<strong>{anchors.length}</strong> of {nodeCount * perNode} kept
		</span>
	</div>

	<p class="result">
		<code
			>anchors = [{#each anchors as c, i (c.n)}{i > 0 ? ', ' : ''}<span
					style:color={color(c.node)}>{c.n}</span
				>{/each}]</code
		>
	</p>

	<div class="controls">
		<button type="button" onclick={play}>{cursor === 0 ? 'Play' : 'Replay'}</button>
		<button type="button" onclick={step}>Step</button>
		<button type="button" onclick={finish} disabled={done}>Finish</button>
	</div>

	<figcaption>
		The tag template is <code>routing:v1:%d</code>. Each integer gets hashed exactly the way Redis will
		hash it, and lands on whichever primary owns that slot. If that primary still has a seat, the
		integer is kept; if not, it's thrown away and the walk moves on. For {nodeCount} primaries at
		{perNode} apiece that takes {walk.length} integers, {totalSkipped === 0
			? 'none of them wasted'
			: `${totalSkipped} of them landing somewhere already full`}. Nothing is stored: every process
		that runs the same walk against the same cluster gets the same list.
	</figcaption>
</figure>

<style>
	.walk {
		margin: 24px 0;
		padding: 16px;
		border: 1px solid var(--border);
		border-radius: 4px;
		background: var(--surface);
		font-family: var(--font-mono);
	}

	.dials {
		display: flex;
		flex-wrap: wrap;
		gap: 8px 24px;
	}

	.dial {
		display: flex;
		align-items: center;
		gap: 10px;
		font-size: 0.68rem;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--color-dim);
	}

	.dial input {
		flex: 0 1 120px;
		width: 120px;
		accent-color: var(--accent);
	}

	.dial-value {
		min-width: 1ch;
		font-variant-numeric: tabular-nums;
		color: var(--accent);
	}

	.work {
		margin: 16px 0;
		padding: 10px 12px;
		min-height: 5.6rem;
		border: 1px dashed var(--border);
		border-radius: 4px;
		background: var(--background);
		font-size: 0.78rem;
		line-height: 1.45;
		color: var(--color-dim);
		font-variant-numeric: tabular-nums;
		overflow-x: auto;
	}

	.line {
		white-space: nowrap;
	}

	.line strong {
		color: var(--color);
	}

	.line.idle {
		font-style: italic;
	}

	.op {
		color: var(--color-dim);
		opacity: 0.8;
	}

	.tag {
		color: var(--accent);
	}

	.keep {
		color: var(--color);
	}

	.skip {
		color: var(--color-dim);
		text-decoration: line-through;
	}

	.ruler-wrap {
		margin-bottom: 14px;
	}

	.ruler {
		position: relative;
		display: flex;
		height: 26px;
		border-radius: 3px;
	}

	.segment {
		display: flex;
		align-items: center;
		justify-content: center;
		box-sizing: border-box;
		border: 1px solid color-mix(in srgb, var(--node-color) 35%, transparent);
		background: color-mix(in srgb, var(--node-color) 8%, transparent);
		color: color-mix(in srgb, var(--node-color) 70%, transparent);
		font-size: 0.62rem;
	}

	.segment:first-child {
		border-radius: 3px 0 0 3px;
	}

	.segment:last-child {
		border-radius: 0 3px 3px 0;
	}

	.landed {
		position: absolute;
		top: 3px;
		bottom: 3px;
		width: 2px;
		margin-left: -1px;
		background: var(--node-color);
		opacity: 0.8;
	}

	.marker {
		position: absolute;
		top: -6px;
		bottom: -6px;
		width: 3px;
		margin-left: -1.5px;
		border-radius: 2px;
		background: var(--node-color);
		box-shadow: 0 0 0 2px var(--surface);
		transition: left 260ms cubic-bezier(0.2, 0.8, 0.2, 1);
	}

	.marker.missed {
		background: var(--color-dim);
	}

	.marker.still {
		transition: none;
	}

	.ruler-ends {
		display: flex;
		justify-content: space-between;
		margin-top: 4px;
		font-size: 0.62rem;
		color: var(--color-dim);
		font-variant-numeric: tabular-nums;
	}

	.tape {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
		min-height: 22px;
		margin: 0 0 16px;
		padding: 0;
		list-style: none;
	}

	.int {
		min-width: 26px;
		height: 22px;
		padding: 0 4px;
		box-sizing: border-box;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1px solid var(--border);
		border-radius: 3px;
		background: var(--background);
		color: var(--color-dim);
		font-size: 0.7rem;
		font-variant-numeric: tabular-nums;
		text-decoration: line-through;
		opacity: 0.55;
	}

	.int.kept {
		border-color: color-mix(in srgb, var(--node-color) 55%, transparent);
		color: var(--node-color);
		text-decoration: none;
		opacity: 1;
	}

	.int.current {
		outline: 1px solid var(--color-dim);
		outline-offset: 1px;
		opacity: 1;
	}

	.bins {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(92px, 1fr));
		gap: 8px;
	}

	.bin {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: 8px;
		border: 1px solid color-mix(in srgb, var(--node-color) 35%, transparent);
		border-radius: 4px;
		background: color-mix(in srgb, var(--node-color) 6%, transparent);
	}

	.bin-title {
		font-size: 0.68rem;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--node-color);
	}

	.bin-range {
		font-size: 0.6rem;
		color: var(--color-dim);
		font-variant-numeric: tabular-nums;
	}

	.seats {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
		margin-top: 6px;
	}

	.seat {
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 26px;
		height: 22px;
		padding: 0 4px;
		box-sizing: border-box;
		border: 1px dashed var(--border);
		border-radius: 3px;
		font-size: 0.7rem;
		font-variant-numeric: tabular-nums;
		color: var(--node-color);
	}

	.seat.filled {
		border-style: solid;
		border-color: color-mix(in srgb, var(--node-color) 55%, transparent);
		background: var(--background);
	}

	.readout {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 12px;
		margin-top: 10px;
		font-size: 0.75rem;
		color: var(--color-dim);
		font-variant-numeric: tabular-nums;
	}

	.kept-count strong {
		color: var(--accent);
		font-size: 1.1rem;
	}

	.result {
		margin: 8px 0 0;
		overflow-x: auto;
	}

	.result code {
		font-size: 0.72rem;
		color: var(--color-dim);
		white-space: nowrap;
	}

	.controls {
		display: flex;
		gap: 8px;
		margin-top: 12px;
	}

	button {
		font-family: var(--font-mono);
		font-size: 0.72rem;
		padding: 5px 10px;
		border: 1px solid var(--border);
		border-radius: 3px;
		background: var(--background);
		color: var(--color-dim);
		cursor: pointer;
	}

	button:hover:not(:disabled) {
		color: var(--color);
		border-color: var(--accent-dim);
	}

	button:disabled {
		opacity: 0.4;
		cursor: default;
	}

	figcaption {
		margin-top: 12px;
		font-size: 0.8rem;
		line-height: 1.5;
		color: var(--color-dim);
	}

	figcaption code {
		font-size: 0.9em;
	}

	@media (max-width: 684px) {
		.walk {
			padding: 12px;
		}

		.work {
			font-size: 0.72rem;
		}

		figcaption {
			font-size: 0.75rem;
		}
	}
</style>
