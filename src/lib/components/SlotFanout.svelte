<script lang="ts">
	import { onMount } from 'svelte';
	import { cubicOut } from 'svelte/easing';
	import { Tween, prefersReducedMotion } from 'svelte/motion';
	import { draw, fade } from 'svelte/transition';
	import {
		buildNodeRanges,
		crc16,
		findAnchors,
		keySlot,
		slotToNode
	} from '$lib/utils/redis-cluster';

	let { nodeCount = 3, perNode = 1, resolution = 9 } = $props();

	// One batch of route estimates: twelve origin/destination H3 cell pairs.
	// Arbitrary, but fixed, so the slots below are stable across renders.
	const PAIRS: [string, string][] = [
		['89283082a53ffff', '892830828efffff'],
		['8928308291fffff', '8928308297bffff'],
		['89283082a87ffff', '89283082bfbffff'],
		['89283082b2fffff', '892830828c7ffff'],
		['892830828d7ffff', '89283082b27ffff'],
		['892830828b3ffff', '89283082b8bffff'],
		['89283082a9fffff', '8928308293bffff'],
		['89283082ad7ffff', '89283082b4fffff'],
		['89283082af7ffff', '8928308295bffff'],
		['89283082ab7ffff', '89283082ab3ffff'],
		['89283082a47ffff', '892830828dbffff'],
		['89283082b7fffff', '89283082b63ffff']
	];

	const NODE_COLORS = ['#ffa86a', '#6fb1ff', '#c79bff'];

	const STAGES = [
		'A batch of keys, still in the process',
		'Every key hashes to a slot',
		'Keys land on whichever node owns their slot',
		'One round trip per slot'
	];

	// Layout constants, in px. The whole diagram is laid out from the measured
	// container width so it reflows rather than scrolling on a phone.
	const GRID_GAP = 8;
	const GRID_PITCH = 28;
	const STACK_PITCH = 26;
	const CHIP_H = 22;
	const CLIENT_TOP = 24;
	const WIRE_GAP = 74;
	const NODE_HEAD = 30;
	const NODE_PAD = 12;

	interface Chip {
		id: number;
		label: string;
		key: string;
		tag: string | null;
		rest: string;
		slot: number;
		node: number;
	}

	interface Batch {
		slot: number;
		node: number;
		members: Chip[];
	}

	let tagged = $state(false);
	let stage = $state(0);
	let width = $state(680);
	let root: HTMLElement | undefined = $state();

	let timer: ReturnType<typeof setTimeout> | undefined;
	let autoplayed = false;

	const ranges = $derived(buildNodeRanges(nodeCount));
	const anchors = $derived(findAnchors(ranges, perNode, (n) => `routing:v1:${n}`));

	function buildChips(useTag: boolean): Chip[] {
		return PAIRS.map(([origin, dest], i) => {
			// Mirrors the post's cacheKey: the pair picks an anchor, the anchor
			// picks the slot, and the rest of the key is along for the ride.
			const anchor = anchors.length ? anchors[crc16(origin + dest) % anchors.length] : 0;
			const tag = useTag ? `routing:v1:${anchor}` : null;
			const key = useTag
				? `{${tag}}:${origin}:${dest}:${resolution}`
				: `${origin}:${dest}:${resolution}`;
			const slot = keySlot(key);

			return {
				id: i,
				label: String(i + 1).padStart(2, '0'),
				key,
				tag,
				rest: `${origin}:${dest}:${resolution}`,
				slot,
				node: slotToNode(slot, ranges)
			};
		});
	}

	function groupBySlot(list: Chip[]): Batch[] {
		const bySlot = new Map<number, Chip[]>();
		for (const chip of list) {
			const members = bySlot.get(chip.slot);
			if (members) {
				members.push(chip);
			} else {
				bySlot.set(chip.slot, [chip]);
			}
		}

		return [...bySlot.entries()]
			.map(([slot, members]) => ({ slot, node: members[0].node, members }))
			.sort((a, b) => a.node - b.node || a.slot - b.slot);
	}

	function tallest(list: Chip[]): number {
		const perNodeCounts = new Array<number>(nodeCount).fill(0);
		for (const chip of list) perNodeCounts[chip.node]++;

		return Math.max(...perNodeCounts);
	}

	const chips = $derived(buildChips(tagged));
	const batches = $derived(groupBySlot(chips));
	const tripsPerNode = $derived(
		batches.reduce((counts, batch) => {
			counts[batch.node]++;
			return counts;
		}, new Array<number>(nodeCount).fill(0))
	);

	// Sized for the worse of the two modes so toggling never resizes the figure.
	const maxStack = $derived(Math.max(tallest(buildChips(false)), tallest(buildChips(true))));

	const plainTrips = $derived(groupBySlot(buildChips(false)).length);
	const taggedTrips = $derived(groupBySlot(buildChips(true)).length);
	const nodeIndexes = $derived([...Array(nodeCount).keys()]);

	const cols = $derived(width < 460 ? 3 : 4);
	const rows = $derived(Math.ceil(PAIRS.length / cols));
	const nodeW = $derived((width - (nodeCount - 1) * 10) / nodeCount);
	const chipW = $derived(
		Math.max(
			52,
			Math.min(88, nodeW - 16, (width - (cols - 1) * GRID_GAP) / cols)
		)
	);

	const clientH = $derived(14 + rows * GRID_PITCH);
	const clientBottom = $derived(CLIENT_TOP + clientH);
	const nodesTop = $derived(clientBottom + WIRE_GAP);
	const nodeH = $derived(NODE_HEAD + maxStack * STACK_PITCH + NODE_PAD);
	const height = $derived(nodesTop + nodeH + 26);

	const placed = $derived.by(() => {
		const gridW = cols * chipW + (cols - 1) * GRID_GAP;
		const gridX = (width - gridW) / 2;

		// Before dispatch every chip sits in the client's grid; after it, in the
		// stack belonging to its node, batch by batch.
		const positions = new Map<number, { x: number; y: number }>();

		chips.forEach((chip, i) => {
			positions.set(chip.id, {
				x: gridX + (i % cols) * (chipW + GRID_GAP),
				y: CLIENT_TOP + 8 + Math.floor(i / cols) * GRID_PITCH
			});
		});

		if (stage < 2) return positions;

		const filled = new Array<number>(nodeCount).fill(0);
		for (const batch of batches) {
			for (const member of batch.members) {
				positions.set(member.id, {
					x: batch.node * (nodeW + 10) + (nodeW - chipW) / 2,
					y: nodesTop + NODE_HEAD + filled[batch.node] * STACK_PITCH
				});
				filled[batch.node]++;
			}
		}

		return positions;
	});

	// One wire per round trip, landing on the node that serves it. Both ends
	// are spread out: a wire per key aimed at a stack of keys draws four
	// requests to one node as a single line, which is the opposite of the point.
	const wires = $derived.by(() => {
		if (stage < 3) return [];

		const total = batches.length;
		const span = width * 0.6;
		const originX = (width - span) / 2;
		const arrived = new Array<number>(nodeCount).fill(0);

		return batches.map((batch, i) => {
			const ox = total > 1 ? originX + span * (i / (total - 1)) : width / 2;
			const oy = clientBottom;

			const seat = arrived[batch.node]++;
			const tx =
				batch.node * (nodeW + 10) + (nodeW * (seat + 1)) / (tripsPerNode[batch.node] + 1);
			const ty = nodesTop;
			const bend = Math.max(24, (ty - oy) * 0.55);

			return {
				id: `${batch.node}:${batch.slot}`,
				node: batch.node,
				tx,
				ty,
				d: `M ${ox} ${oy} C ${ox} ${oy + bend}, ${tx} ${ty - bend}, ${tx} ${ty}`
			};
		});
	});

	const trips = new Tween(0, { duration: 600, easing: cubicOut });
	$effect(() => {
		trips.set(stage >= 3 ? batches.length : 0, {
			duration: prefersReducedMotion.current ? 0 : 600
		});
	});

	const sample = $derived(chips[0]);

	function stop() {
		clearTimeout(timer);
		timer = undefined;
	}

	function advance() {
		stop();
		stage = stage >= STAGES.length - 1 ? 0 : stage + 1;
	}

	function play() {
		stop();
		stage = 0;
		const tick = () => {
			if (stage >= STAGES.length - 1) return;
			stage++;
			timer = setTimeout(tick, 1100);
		};
		timer = setTimeout(tick, prefersReducedMotion.current ? 0 : 500);
	}

	function setTagged(next: boolean) {
		if (next === tagged) return;
		stop();
		tagged = next;
		// Toggling mid-explanation is the point of the figure, so hold the stage
		// and let the keys rearrange under it.
		if (stage < 2) stage = 3;
	}

	onMount(() => {
		if (prefersReducedMotion.current) {
			stage = STAGES.length - 1;
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

<figure class="fanout" bind:this={root}>
	<div class="modes" role="group" aria-label="Key format">
		<button type="button" aria-pressed={!tagged} onclick={() => setTagged(false)}>
			Plain keys
		</button>
		<button type="button" aria-pressed={tagged} onclick={() => setTagged(true)}>
			Hash-tagged keys
		</button>
	</div>

	<div class="stage" bind:clientWidth={width} style:height="{height}px">
		<div
			class="box client"
			style:top="{CLIENT_TOP}px"
			style:height="{clientH}px"
			aria-hidden="true"
		></div>
		<span class="box-label" style:top="{CLIENT_TOP - 18}px">client process</span>
		{#if stage >= 2}
			<span
				class="command"
				style:top="{CLIENT_TOP + clientH / 2 - 11}px"
				transition:fade={{ duration: prefersReducedMotion.current ? 0 : 200 }}
			>
				MGET &middot; {PAIRS.length} keys
			</span>
		{/if}

		{#each nodeIndexes as i (i)}
			<div
				class="box node"
				style:top="{nodesTop}px"
				style:left="{i * (nodeW + 10)}px"
				style:width="{nodeW}px"
				style:height="{nodeH}px"
				style:--node-color={NODE_COLORS[i % NODE_COLORS.length]}
				aria-hidden="true"
			></div>
			<span
				class="node-title"
				style:top="{nodesTop + 8}px"
				style:left="{i * (nodeW + 10)}px"
				style:width="{nodeW}px"
				style:color={NODE_COLORS[i % NODE_COLORS.length]}
			>
				primary {i + 1}
			</span>
			<span
				class="node-trips"
				style:top="{nodesTop + nodeH + 4}px"
				style:left="{i * (nodeW + 10)}px"
				style:width="{nodeW}px"
			>
				{#if stage >= 3}
					{tripsPerNode[i]}
					{tripsPerNode[i] === 1 ? 'round trip' : 'round trips'}
				{/if}
			</span>
		{/each}

		<svg class="wires" viewBox="0 0 {width} {height}" aria-hidden="true">
			{#each wires as wire (wire.id)}
				{@const color = NODE_COLORS[wire.node % NODE_COLORS.length]}
				<path
					d={wire.d}
					stroke={color}
					transition:draw={{ duration: prefersReducedMotion.current ? 0 : 450, easing: cubicOut }}
				/>
				<circle
					cx={wire.tx}
					cy={wire.ty}
					r="3"
					fill={color}
					transition:fade={{
						duration: prefersReducedMotion.current ? 0 : 200,
						delay: prefersReducedMotion.current ? 0 : 400
					}}
				/>
			{/each}
		</svg>

		{#each chips as chip (chip.id)}
			{@const at = placed.get(chip.id)}
			<div
				class="chip"
				class:hashed={stage >= 1}
				class:still={prefersReducedMotion.current}
				title={chip.key}
				style:width="{chipW}px"
				style:height="{CHIP_H}px"
				style:transform="translate({at?.x ?? 0}px, {at?.y ?? 0}px)"
				style:--node-color={NODE_COLORS[chip.node % NODE_COLORS.length]}
			>
				{stage >= 1 ? chip.slot : `#${chip.label}`}
			</div>
		{/each}
	</div>

	<div class="readout">
		<span class="step">{stage + 1}/{STAGES.length} &middot; {STAGES[stage]}</span>
		<span class="trips" aria-live="polite">
			<strong>{Math.round(trips.current)}</strong> round trips
		</span>
	</div>

	<p class="keyline">
		{#if sample.tag}
			<code><span class="tag">&#123;{sample.tag}&#125;</span>:{sample.rest}</code>
		{:else}
			<code>{sample.rest}</code>
		{/if}
	</p>

	<div class="controls">
		<button type="button" onclick={play}>
			{stage === 0 ? 'Play' : 'Replay'}
		</button>
		<button type="button" onclick={advance}>Step</button>
	</div>

	<figcaption>
		Twelve route keys, {nodeCount} primaries. Hashed whole, every key lands in a slot of its own and
		one MGET turns into {plainTrips} round trips. Wrap a shared tag in braces and only the braces get
		hashed, so the same twelve keys collapse onto {taggedTrips} slots: {taggedTrips} round trips, one
		per node, running at the same time.
	</figcaption>
</figure>

<style>
	.fanout {
		margin: 24px 0;
		padding: 16px;
		border: 1px solid var(--border);
		border-radius: 4px;
		background: var(--surface);
		font-family: var(--font-mono);
	}

	.stage {
		position: relative;
		width: 100%;
	}

	.box {
		position: absolute;
		border: 1px dashed var(--border);
		border-radius: 4px;
	}

	.client {
		left: 0;
		right: 0;
		background: rgba(255, 255, 255, 0.02);
	}

	.node {
		border: 1px solid color-mix(in srgb, var(--node-color) 35%, transparent);
		background: color-mix(in srgb, var(--node-color) 6%, transparent);
	}

	.box-label,
	.node-title,
	.node-trips {
		position: absolute;
		font-size: 0.68rem;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--color-dim);
	}

	.node-title,
	.node-trips {
		text-align: center;
	}

	.command {
		position: absolute;
		left: 0;
		right: 0;
		text-align: center;
		font-size: 0.8rem;
		color: var(--color-dim);
	}

	.node-trips {
		text-transform: none;
		letter-spacing: 0;
		font-variant-numeric: tabular-nums;
	}

	.wires {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
	}

	.wires path {
		fill: none;
		stroke-width: 1.5;
		opacity: 0.75;
	}

	.chip {
		position: absolute;
		top: 0;
		left: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		box-sizing: border-box;
		border: 1px solid var(--border);
		border-radius: 3px;
		background: var(--background);
		color: var(--color-dim);
		font-size: 0.72rem;
		font-variant-numeric: tabular-nums;
		transition:
			transform 600ms cubic-bezier(0.2, 0.8, 0.2, 1),
			color 300ms ease,
			border-color 300ms ease;
	}

	.chip.hashed {
		border-color: color-mix(in srgb, var(--node-color) 55%, transparent);
		color: var(--node-color);
	}

	.chip.still {
		transition: none;
	}

	.readout {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 12px;
		margin-top: 8px;
		font-size: 0.75rem;
		color: var(--color-dim);
	}

	.trips strong {
		color: var(--accent);
		font-size: 1.1rem;
		font-variant-numeric: tabular-nums;
	}

	.keyline {
		margin: 8px 0 0;
		overflow-x: auto;
	}

	.keyline code {
		font-size: 0.72rem;
		color: var(--color-dim);
		white-space: nowrap;
	}

	.keyline .tag {
		color: var(--accent);
	}

	.modes,
	.controls {
		display: flex;
		gap: 8px;
	}

	.modes {
		margin-bottom: 20px;
	}

	.controls {
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

	button:hover {
		color: var(--color);
		border-color: var(--accent-dim);
	}

	button[aria-pressed='true'] {
		color: var(--accent);
		border-color: var(--accent);
	}

	figcaption {
		margin-top: 12px;
		font-family: inherit;
		font-size: 0.8rem;
		line-height: 1.5;
		color: var(--color-dim);
	}

	@media (max-width: 684px) {
		.fanout {
			padding: 12px;
		}

		figcaption {
			font-size: 0.75rem;
		}
	}
</style>
