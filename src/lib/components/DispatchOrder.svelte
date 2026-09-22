<script lang="ts">
	import { onMount } from 'svelte';
	import { cubicOut } from 'svelte/easing';
	import { Tween, prefersReducedMotion } from 'svelte/motion';
	import { buildNodeRanges, crc16, findAnchors, keySlot, slotToNode } from '$lib/utils/redis-cluster';

	let { nodeCount = 3 } = $props();

	// The same tagged keys figure one ends with: twenty-four route keys spread
	// evenly over one hash tag per primary.
	const PAIRS: [string, string][] = [
		['8928308298bffff', '8928308281fffff'],
		['892830828f3ffff', '8928308285bffff'],
		['892830828cfffff', '892830829dbffff'],
		['89283082a4bffff', '892830829abffff'],
		['89283082a63ffff', '89283082933ffff'],
		['89283082b57ffff', '89283082afbffff'],
		['89283082b7fffff', '89283082a3bffff'],
		['892830828d7ffff', '892830828c7ffff'],
		['89283082827ffff', '8928308295bffff'],
		['8928308284fffff', '89283082bffffff'],
		['89283082ab3ffff', '89283082a1fffff'],
		['892830828d3ffff', '89283082b93ffff'],
		['8928308289bffff', '89283082aa3ffff'],
		['89283082bb3ffff', '89283082b3fffff'],
		['89283082a67ffff', '8928308296bffff'],
		['89283082b2bffff', '89283082943ffff'],
		['89283082b7bffff', '89283082babffff'],
		['89283082897ffff', '8928308281bffff'],
		['89283082a2bffff', '89283082bf3ffff'],
		['89283082af7ffff', '89283082843ffff'],
		['89283082bfbffff', '8928308283fffff'],
		['89283082a7bffff', '892830829fbffff'],
		['89283082847ffff', '89283082b37ffff'],
		['89283082b73ffff', '89283082b47ffff']
	];

	const NODE_COLORS = ['#ffa86a', '#6fb1ff', '#c79bff'];

	const LABEL_W = 84;
	const ROW_H = 30;
	const ROW_GAP = 10;

	interface Key {
		slot: number;
		node: number;
	}

	interface Command {
		slot: number;
		node: number;
		keys: number;
		start: number;
		end: number;
	}

	let grouped = $state(false);
	let chunkSize = $state(4);
	let width = $state(680);
	let root: HTMLElement | undefined = $state();
	let autoplayed = false;

	const ranges = $derived(buildNodeRanges(nodeCount));
	const anchors = $derived(findAnchors(ranges, 1, (n) => `routing:v1:${n}`));

	const keys = $derived(
		PAIRS.map(([origin, dest]) => {
			const anchor = anchors[crc16(origin + dest) % anchors.length];
			const slot = keySlot(`routing:v1:${anchor}`);

			return { slot, node: slotToNode(slot, ranges) };
		})
	);

	// What the caller hands you, cut into chunks: the keys are in whatever order
	// they were built, so a chunk holds keys for more than one slot.
	const chunks = $derived.by(() => {
		const out: Key[][] = [];
		for (let i = 0; i < keys.length; i += chunkSize) {
			out.push(keys.slice(i, i + chunkSize));
		}

		return out;
	});

	const slotGroups = $derived.by(() => {
		const bySlot = new Map<number, Key[]>();
		for (const key of keys) {
			const members = bySlot.get(key.slot);
			if (members) {
				members.push(key);
			} else {
				bySlot.set(key.slot, [key]);
			}
		}

		return [...bySlot.values()];
	});

	// A cluster client can't put two slots in one command, so every pile it is
	// handed becomes one command per slot inside it.
	function dispatch(piles: Key[][]): Command[] {
		const queued = new Array<number>(nodeCount).fill(0);
		const commands: Command[] = [];

		for (const pile of piles) {
			const bySlot = new Map<number, Key[]>();
			for (const key of pile) {
				const members = bySlot.get(key.slot);
				if (members) {
					members.push(key);
				} else {
					bySlot.set(key.slot, [key]);
				}
			}

			for (const [slot, members] of bySlot) {
				// Everything goes out at once; the node is what serializes it.
				const start = queued[members[0].node]++;
				commands.push({
					slot,
					node: members[0].node,
					keys: members.length,
					start,
					end: start + 1
				});
			}
		}

		return commands;
	}

	function wallClock(commands: Command[]): number {
		return commands.reduce((latest, command) => Math.max(latest, command.end), 0);
	}

	const piles = $derived(grouped ? slotGroups : chunks);
	const commands = $derived(dispatch(piles));
	const total = $derived(wallClock(commands));

	// Both modes share the axis of the slower one, so the comparison is a
	// length rather than a number you have to remember.
	const units = $derived(Math.max(total, wallClock(dispatch(chunks))));

	const unit = $derived(Math.max(22, (width - LABEL_W) / units));
	const ganttH = $derived(nodeCount * ROW_H + (nodeCount - 1) * ROW_GAP);

	const nodeIndexes = $derived([...Array(nodeCount).keys()]);
	const ticks = $derived([...Array(units + 1).keys()]);

	const clock = new Tween(0, { duration: 2000, easing: cubicOut });

	function run() {
		clock.set(0, { duration: 0 });
		clock.set(total, {
			duration: prefersReducedMotion.current ? 0 : 400 + 260 * total,
			easing: cubicOut
		});
	}

	function settle() {
		clock.set(total, { duration: prefersReducedMotion.current ? 0 : 400 });
	}

	function setGrouped(next: boolean) {
		if (next === grouped) return;
		grouped = next;
		settle();
	}

	onMount(() => {
		if (prefersReducedMotion.current) {
			clock.set(total, { duration: 0 });
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (!entry.isIntersecting || autoplayed) continue;
					autoplayed = true;
					run();
				}
			},
			{ threshold: 0.4 }
		);

		if (root) observer.observe(root);

		return () => observer.disconnect();
	});
</script>

<figure class="dispatch" bind:this={root}>
	<div class="modes" role="group" aria-label="How the batch is split">
		<button type="button" aria-pressed={!grouped} onclick={() => setGrouped(false)}>
			Chunk the list
		</button>
		<button type="button" aria-pressed={grouped} onclick={() => setGrouped(true)}>
			Group by slot
		</button>
	</div>

	<label class="dial">
		<span>keys per chunk</span>
		<input
			type="range"
			min="2"
			max="12"
			step="1"
			bind:value={chunkSize}
			oninput={settle}
			disabled={grouped}
		/>
		<span class="dial-value">{grouped ? 'by slot' : chunkSize}</span>
	</label>

	<ol class="piles">
		{#each piles as pile, i (i)}
			<li class="pile">
				<span class="dots">
					{#each pile as key, k (k)}
						<span
							class="dot"
							style:--node-color={NODE_COLORS[key.node % NODE_COLORS.length]}
						></span>
					{/each}
				</span>
				<span class="pile-cost">
					{new Set(pile.map((key) => key.slot)).size}
					{new Set(pile.map((key) => key.slot)).size === 1 ? 'command' : 'commands'}
				</span>
			</li>
		{/each}
	</ol>

	<div class="gantt" bind:clientWidth={width} style:height="{ganttH + 22}px">
		{#each nodeIndexes as node (node)}
			<span class="row-label" style:top="{node * (ROW_H + ROW_GAP) + 8}px">
				primary {node + 1}
			</span>
			<div
				class="track"
				style:top="{node * (ROW_H + ROW_GAP)}px"
				style:left="{LABEL_W}px"
				style:width="{units * unit}px"
				style:height="{ROW_H}px"
			></div>
		{/each}

		{#each commands as command, i (`${command.node}:${command.start}:${i}`)}
			{@const served = Math.max(0, Math.min(1, clock.current - command.start))}
			{#if served > 0}
				<div
					class="block"
					title="slot {command.slot}, {command.keys} keys"
					style:top="{command.node * (ROW_H + ROW_GAP)}px"
					style:left="{LABEL_W + command.start * unit}px"
					style:width="{Math.max(0, served * unit - 3)}px"
					style:height="{ROW_H}px"
					style:--node-color={NODE_COLORS[command.node % NODE_COLORS.length]}
				>
					{#if served > 0.6 && unit > 44}<span>{command.keys}</span>{/if}
				</div>
			{/if}
		{/each}

		<div
			class="playhead"
			style:left="{LABEL_W + clock.current * unit}px"
			style:height="{ganttH}px"
		></div>

		{#each ticks as tick (tick)}
			<span class="tick" style:left="{LABEL_W + tick * unit}px" style:top="{ganttH + 4}px">
				{tick}
			</span>
		{/each}
	</div>

	<div class="readout">
		<span class="axis">command times &middot; {commands.length} commands</span>
		<span class="wall" aria-live="polite">
			<strong>{Math.min(clock.current, total).toFixed(1)}</strong> to finish
		</span>
	</div>

	<div class="controls">
		<button type="button" onclick={run}>Replay</button>
	</div>

	<figcaption>
		{PAIRS.length} tagged keys, {anchors.length} slots, {nodeCount} primaries, every command costing
		the same round trip whatever it carries. Cut the list into chunks and each chunk still holds keys
		for more than one slot, so the client splits it and every primary gets one command per chunk to run
		one after another. Group by slot first and it's one command per primary, all of them in flight at
		once. Chunk size is the whole dial, and it runs the wrong way: the finer you cut, the more commands
		you make, which is how fanning out over more goroutines buys you a slower read.
	</figcaption>
</figure>

<style>
	.dispatch {
		margin: 24px 0;
		padding: 16px;
		border: 1px solid var(--border);
		border-radius: 4px;
		background: var(--surface);
		font-family: var(--font-mono);
	}

	.modes,
	.controls {
		display: flex;
		gap: 8px;
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

	.dial {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-top: 12px;
		font-size: 0.68rem;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--color-dim);
	}

	.dial input {
		flex: 0 1 180px;
		accent-color: var(--accent);
	}

	.dial input:disabled {
		opacity: 0.35;
	}

	.dial-value {
		font-variant-numeric: tabular-nums;
		text-transform: none;
		color: var(--accent);
	}

	.piles {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin: 12px 0 20px;
		padding: 0;
		list-style: none;
	}

	.pile {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 6px 8px;
		border: 1px solid var(--border);
		border-radius: 3px;
		background: var(--background);
	}

	.dots {
		display: flex;
		flex-wrap: wrap;
		gap: 3px;
		max-width: 92px;
	}

	.dot {
		width: 8px;
		height: 8px;
		border-radius: 2px;
		background: var(--node-color);
	}

	.pile-cost {
		font-size: 0.62rem;
		color: var(--color-dim);
		white-space: nowrap;
	}

	.row-label,
	.axis {
		font-size: 0.68rem;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--color-dim);
	}

	.gantt {
		position: relative;
		width: 100%;
	}

	.row-label {
		position: absolute;
		left: 0;
		text-transform: none;
	}

	.track {
		position: absolute;
		border: 1px dashed var(--border);
		border-radius: 3px;
	}

	.block {
		position: absolute;
		display: flex;
		align-items: center;
		justify-content: center;
		box-sizing: border-box;
		border: 1px solid color-mix(in srgb, var(--node-color) 55%, transparent);
		border-radius: 3px;
		background: color-mix(in srgb, var(--node-color) 14%, transparent);
		color: var(--node-color);
		font-size: 0.7rem;
		font-variant-numeric: tabular-nums;
		overflow: hidden;
	}

	.playhead {
		position: absolute;
		top: 0;
		width: 1px;
		background: var(--color-dim);
		opacity: 0.4;
	}

	.tick {
		position: absolute;
		font-size: 0.65rem;
		color: var(--color-dim);
		transform: translateX(-50%);
		font-variant-numeric: tabular-nums;
	}

	.readout {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 12px;
		margin-top: 6px;
		font-size: 0.75rem;
		color: var(--color-dim);
	}

	.wall strong {
		color: var(--accent);
		font-size: 1.1rem;
		font-variant-numeric: tabular-nums;
	}

	figcaption {
		margin-top: 12px;
		font-size: 0.8rem;
		line-height: 1.5;
		color: var(--color-dim);
	}

	@media (max-width: 684px) {
		.dispatch {
			padding: 12px;
		}

		figcaption {
			font-size: 0.75rem;
		}
	}
</style>
