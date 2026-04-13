---
title: "Detail Zoom Test"
date: "2026-04-12T12:00:00-06:00"
author: "verygoodsoftwarenotvirus"
draft: true
---

<script>
  import DetailZoom from '$lib/components/DetailZoom.svelte';
  import D from '$lib/components/D.svelte';
  import Extra from '$lib/components/Extra.svelte';
</script>

<DetailZoom levels={3}>

This post demonstrates the detail zoom feature. Use the slider above to adjust the level of detail.

## Making Soup

First, prepare your ingredients.

<D level={1}>

Dice the onion and add it to the pan.

</D>
<D level={2}>

Do a fine dice on the onion and put it in the pan with the simmering oil.

</D>
<D level={3}>

Dice the onion into 1/4" pieces and scrape them into the heated saute pan with the medium-high olive oil.

</D>

## Shopping

I went to the supermarket yesterday and found a few things.

<Extra min={2}>

They were all out of cucumbers, but I was able to make do with zucchini instead.

</Extra>

<Extra min={3}>

The zucchini was from the organic section, which cost about $2 more per pound but was noticeably fresher.

</Extra>

## Regular Content

This paragraph is always visible regardless of the detail level. The detail zoom feature only affects content wrapped in the D and Extra components.

</DetailZoom>
