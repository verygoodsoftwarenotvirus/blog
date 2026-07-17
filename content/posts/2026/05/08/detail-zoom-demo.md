---
title: "Detail Zoom: a guided demo"
date: "2026-05-08T12:00:00-06:00"
author: "verygoodsoftwarenotvirus"
draft: false
---

<script>
  import DetailZoom from '$lib/components/DetailZoom.svelte';
  import D from '$lib/components/D.svelte';
  import Extra from '$lib/components/Extra.svelte';
</script>

This page is a working demo of the **detail zoom** feature on this blog. There's a slider stuck to the top of your viewport — drag it and watch the prose change.

## How it works

There's one **global** detail level for the page. Two small components pay attention to it:

- `<D level={k}>...</D>` — content that **replaces itself** at level `k`. Only one `D` for a given group is visible at a time.
- `<Extra min={k}>...</Extra>` — content that **appears at level `k` and stays** as the reader zooms further in.

The slider at the top of the page appears automatically: at build time, the post is scanned for `<D>` and `<Extra>` tags and the slider's range is set to the highest level number it finds. If a post has no detail markers at all, no slider appears.

Mental model: `D` is a swap, `Extra` is a footnote that earns its way in.

---

## Demo 1 — the basic three-level swap

How does a CPU run a program?

<D level={1}>

It reads instructions one at a time and does what they say.

</D>
<D level={2}>

It fetches an instruction from memory, decodes it into an operation plus operands, executes the operation, and writes the result back. Then it repeats.

</D>
<D level={3}>

The front end fetches instructions from the L1 instruction cache, decodes them into micro-ops, and dispatches them into a reorder buffer. Independent µops issue out of order to execution units (ALUs, load/store, branch); results retire in program order via the ROB so the architectural state stays sequentially consistent. Caches, branch prediction, and speculation hide most of the memory and control latency.

</D>

That paragraph above is the only thing that swaps in this section. Everything else is normal markdown and is unaffected by the slider.

---

## Demo 2 — `Extra` as progressive footnotes

I made bread on Saturday.

<Extra min={2}>

It was a sourdough using a starter I've been keeping in the fridge for about a year.

</Extra>

<Extra min={3}>

The hydration was 78%, bulk was around five hours at 76°F, and I cold-retarded the shaped loaf overnight before baking in a Dutch oven at 500°F covered, then 450°F uncovered.

</Extra>

At Brief, the post is a sentence. At Detailed, it's a recipe.

---

## Demo 3 — `D` and `Extra` mixed

The deploy failed.

<D level={1}>

It's fixed now.

</D>
<D level={2}>

The healthcheck was timing out, so the load balancer never sent traffic to the new pods.

</D>
<D level={3}>

The new image's startup probe was set to a 1s threshold, but a cold JIT warmup took ~4s. The rolling deploy looked healthy locally because the cached image skipped the warmup; in prod every fresh pod failed the probe and got killed.

</D>

<Extra min={2}>

This took down checkout for about eleven minutes.

</Extra>

<Extra min={3}>

Postmortem doc is in the incidents folder; the action items are owned by the platform team.

</Extra>

---

## Demo 4 — inline use mid-paragraph

Detail markers also work inline. The animal was <D level={1}>big</D><D level={2}>about three meters long</D><D level={3}>3.2 m from snout to tail tip, give or take</D>, and it moved fast.

---

## Scoped sliders with `<DetailZoom>`

Sometimes you want a single section to have *its own* slider, independent of the page-level one. Wrap that section in `<DetailZoom levels={N}>`. Inside, `D` and `Extra` will respond to the local slider instead of the global one. Outside, everything still follows the global slider.

<DetailZoom levels={2}>

The slider directly above is local to this block — only two stops, only affects what's inside it.

<D level={1}>

Brief — local to this block.

</D>
<D level={2}>

Detailed — also local to this block. Move the page-level slider at the top: this paragraph won't change.

</D>

</DetailZoom>

Back outside the scoped block, the page-level slider takes over again.

---

## Bug-hunt section (deliberately weird)

Each subsection notes what I expect — if reality disagrees, that's a bug.

### A. A missing middle level

The author wrote level 1 and level 3 but forgot level 2. **Expected:** at level 2 the paragraph silently disappears.

The forecast for tomorrow:

<D level={1}>

Rain.

</D>
<D level={3}>

A slow-moving low pressure system off the coast will produce 0.5–1.0 inches of rainfall through the afternoon, tapering after sundown.

</D>

### B. Out-of-range levels

Below I've written a `<D level={0}>` and a `<D level={99}>`. The page slider only goes to the highest legitimate level it found, so neither should ever render.

<D level={0}>

This one is at level 0 — should be unreachable.

</D>
<D level={1}>

Visible at Brief.

</D>

(I'm deliberately not putting `level={99}` here because the auto-detector would then bump the slider's max to 99. The lesson: *the auto-detector trusts whatever number you write*, so don't write a number you don't mean.)

### C. `Extra min={1}`

**Expected:** always visible, since the slider can't go below 1.

Sentence before.

<Extra min={1}>

This Extra has min=1, so it should always render.

</Extra>

Sentence after.

### D. `Extra min` higher than the slider's max

I want an Extra that only appears at the very deepest level. If I write `min={N}` where N matches the slider's max, it'll show only at the rightmost stop.

<Extra min={3}>

You should see this only when the page slider is fully right.

</Extra>

### E. Block content inside `D`

`D` and `Extra` wrap their children in a `<span>`. Block elements inside an inline element produce technically invalid HTML — browsers cope, but worth knowing.

<D level={1}>

A short version.

</D>
<D level={2}>

## A heading inside a D

- a list
- with items

```js
const code = "even a code block";
```

> and a blockquote

</D>

### F. Empty `D` and `Extra`

**Expected:** an empty span, no crash.

Before.

<D level={1}></D>
<D level={2}></D>

<Extra min={2}></Extra>

After.

### G. Two `D`s with the same level

**Expected:** both show simultaneously when the slider hits that level.

<D level={1}>

First level-1 block.

</D>
<D level={1}>

Second level-1 block — should appear next to the first.

</D>

### H. `D` / `Extra` outside any `DetailZoom`

This used to crash SSR — the components would call `getContext()`, get `undefined`, then dereference `.level`. Now they default to level 1 if no provider is present, and on a post page the page-level provider in `PostLayout` is always present, so they just work.

### I. Nested `<DetailZoom>`

The inner zoom is inside the outer. Both call `setContext('detail-zoom-level', ...)`, and Svelte's context shadows from inner to descendants. The inner slider should only affect content inside the inner block.

<DetailZoom levels={3}>

Outer slider:

<D level={1}>

Outer brief.

</D>
<D level={3}>

Outer detailed.

</D>

<DetailZoom levels={2}>

Inner slider — only affects what's inside this nested block:

<D level={1}>

Inner brief.

</D>
<D level={2}>

Inner detailed.

</D>

</DetailZoom>

</DetailZoom>

### J. Slider stickiness

Scroll past this section. The page-level slider should stay attached to the top of the viewport. Changing it while scrolled should re-render the right paragraphs without losing your scroll position.

<D level={1}>Brief here.</D><D level={2}>Standard here.</D><D level={3}>Detailed here.</D>

Lorem ipsum filler one. Lorem ipsum filler two. Lorem ipsum filler three. Lorem ipsum filler four. Lorem ipsum filler five. Lorem ipsum filler six. Lorem ipsum filler seven. Lorem ipsum filler eight. Lorem ipsum filler nine. Lorem ipsum filler ten. Lorem ipsum filler eleven. Lorem ipsum filler twelve. Lorem ipsum filler thirteen. Lorem ipsum filler fourteen. Lorem ipsum filler fifteen.

<D level={1}>Brief later.</D><D level={2}>Standard later.</D><D level={3}>Detailed later.</D>

Lorem ipsum filler sixteen. Lorem ipsum filler seventeen. Lorem ipsum filler eighteen. Lorem ipsum filler nineteen. Lorem ipsum filler twenty. Lorem ipsum filler twenty-one. Lorem ipsum filler twenty-two. Lorem ipsum filler twenty-three. Lorem ipsum filler twenty-four. Lorem ipsum filler twenty-five.

---

## Writing posts that use this

Put this script block at the top of any post that uses detail markers:

```svelte
<script>
  import DetailZoom from '$lib/components/DetailZoom.svelte';
  import D from '$lib/components/D.svelte';
  import Extra from '$lib/components/Extra.svelte';
</script>
```

Then sprinkle `<D>` and `<Extra>` wherever you want. The page-level slider appears automatically when there's at least one `level={2}` (or higher) somewhere on the page.

Two rules of thumb:

1. **Leave a blank line** between the opening `<D>`/`<Extra>` tag and the markdown that follows, and between the closing tag and the markdown above it. MDsveX needs the blank lines to switch back into markdown mode. (For inline use, no blank lines — inline is inline.)
2. **Keep `D` blocks small.** They're rendered inside a `<span>`, so block-level markdown inside them produces invalid (though usually-tolerated) HTML.

If you spot something on this page misbehaving, that's the bug — open the source for this post next to the rendered version and compare.
