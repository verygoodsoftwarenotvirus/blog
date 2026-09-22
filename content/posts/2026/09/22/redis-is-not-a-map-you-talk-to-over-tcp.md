---
title: "Redis is not a map you talk to over TCP"
date: "2026-09-22T18:22:04-05:00"
author: "verygoodsoftwarenotvirus"
---

<script>
  import D from '$lib/components/D.svelte';
  import Extra from '$lib/components/Extra.svelte';
  import SlotFanout from '$lib/components/SlotFanout.svelte';
  import DispatchOrder from '$lib/components/DispatchOrder.svelte';
  import AnchorWalk from '$lib/components/AnchorWalk.svelte';
</script>

I work on the team that decides which courier gets offered your delivery at a gig economy delivery app. When you open the app and ask for a thing to be brought to you, some code somewhere has to decide which of the couriers should be offered the job. We're the ones who make those offers.

I'm not at liberty to discuss the myriad parameters that go into the decision, but a pretty obvious one you can suss out externally without knowing much is distance. To make good matches, we need to know *how far away is everybody, really*. Straight-line distance will cheerfully tell you that a courier on the far side of a river is close by, so the number we actually need is driving time. For that we lean on a routing engine, which is far and away the biggest contributor to our own latency. When it's slow, we're slow, and when we're slow, the app is a worse product.

# The shape of the problem

A busy area needs a tremendous amount of route estimates to get through a single pass at assigning work, and it needs them again continuously, for as long as the business is running. Volume isn't a choice anyone gets to make. Scale is the requirement, not the optimization. (More on this later.)

The useful thing about those estimates is that they're frequently repetitive. It doesn't take the guy three houses down from me any meaningful amount more or less time to get to the grocery store than it takes me, and neither of us could tell the difference between driving to that grocery store and driving to the gas station in its parking lot. Restaurants, meanwhile, do not move at all. Two couriers a block apart produce two nearly identical route requests, and thirty seconds later, from two new positions, they produce two more.

Without any form of caching layer between us and the routing engine, you're invariably duplicating work, re-calculating what are functionally the same distances on a regular cadence for sometimes dozens of minutes at a time.

A process-local cache doesn't get us there: the process that computes an estimate is rarely the one that needs it next, so the cache has to be shared.

I don't like to reflexively reach for caching, anecdotally it's been a "but this will make it faster!" button for naive implementers. This felt like it fit the bill in a different way.

# The naive approach

You can't cache on raw coordinates. Two points a meter apart are, for our purposes, the same point, but they're different float64s and they'll never produce a cache hit. You need to snap the world to a grid first.

We used [H3](https://h3geo.org/) to dedupe the coordinates. H3 chops the earth into hexagons at sixteen resolutions, and gives you a stable ID for the hex containing any lat/lng. Snap the origin to a hex, snap the destination to a hex, and now every coordinate pair inside those two hexes collapses onto one cache key. 

<Extra min={2}>

The resolution is the dial for the whole system. Coarse hexes give you a great hit rate and a worse answer; fine hexes give you a precise answer nobody ever asks for again. There's no single right setting and you will change your mind, which is why the resolution is baked into the key itself rather than assumed. Two resolutions can coexist in the cache, and you can move between them without a flush.

</Extra>

So the key was `<origin hex>:<dest hex>:<resolution>`, the value was the estimate, and the write path was an `MSET`. Compute a batch, write the batch. I dusted my hands, shipped it, and sat back ready to reap the rewards of forthcoming scale.

It did not scale even a little bit.

# Not so fast, there

<D level={1}>

Our Redis is a cluster, and a cluster does not think about your keys the way a single Redis does.

</D>

<D level={2}>

Our Redis is a cluster, and clustered Redis splits the keyspace into 16,384 hash slots divided up among the primary nodes. A multi-key command like `MSET` is only legal if every key in it lands in the same slot.

</D>

<D level={3}>

Our Redis is a cluster, and clustered Redis divides the keyspace into 16,384 hash slots, assigning each slot to a primary node. A multi-key command like `MSET` is only legal if every key in it belongs to the same slot, otherwise you get `CROSSSLOT Keys in request don't hash to the same slot` and nothing gets written at all.

</D>

<Extra min={2}>

A note on the word, since I'm about to use it a lot: Redis calls these nodes *masters*. I call them primaries. The docs, the `CLUSTER` output and the config directives all still say the other thing, so that's the word you'll need if you go grepping for any of this, but it isn't the word I'm going to type for the rest of the post.

</Extra>

<D level={1}>

Which slot a key lands in isn't up to me, it falls out of a checksum of the key itself. Since every one of my keys was different, no two of them agreed on a slot, and my one tidy batch write fell apart into one command per key.

</D>

I found this out from a trace. A single read was turning up in production as loads of **individual `MGET` spans**, and that was likely an undercount. The root span reported the total key count, and the arithmetic didn't come close to agreeing with the number of child spans that had survived, so the Otel collector was almost assuredly dropping them. Our max read latency monitor was something like 10x higher than our anticipated worst case. It was in production for less than a day before that trace made it obvious, which is the only part of this story I'd call a win. 

This is how I learned slots exist.

<Extra min={2}>

Which slot a key lands in is not configurable and not random. It's `CRC16(key) mod 16384`. Two keys that differ by one character land in slots that have nothing to do with each other, which is wonderful for even distribution and catastrophic for batching. My keys had a different origin hex, destination hex in every one of them. The odds of any two of them sharing a slot were, functionally, 1 in 16,384.

That fan-out wasn't the client misbehaving, it was the client being conscientious. A multi-key command can only address one slot, so a well-built cluster client takes your single `MGET` of a ton of keys, groups them by the slot each one belongs to, and puts every group on its own wire. Given what I'd handed it, that was the only correct thing it could do. There is no combination of settings under which one `MGET` per key is fast. The fix isn't in the client's configuration, it's in not handing it keys that live in that many different slots.

The write path had the same disease wearing a different hat: either an outright `CROSSSLOT` error, or one `SET` and one round trip per key.

</Extra>

# Hash tags, not hashtags

Redis has an escape hatch for exactly this, called a hash tag (NOT a hashtag). If a key contains a `{`, and there's a `}` somewhere after it with at least one character in between, then Redis hashes *only* the text between the braces and ignores the rest of the key.

That means you get to decide, deliberately, which keys share a slot.

<Extra min={2}>

<SlotFanout />

</Extra>

<Extra min={2}>

The trap is what you choose to put in the braces. The tempting move is something semantic: tag by origin hex, say, so all the routes out of one hex batch together. That works right up until you look at a heat map and realize you've built a hot spot. Downtown at dinnertime is one hex, one tag, one slot, one node, and that node is now on fire while the rest of the cluster naps.

What you actually want is the opposite of semantic. You want the tag to carry no meaning at all, and to be chosen so the buckets land evenly across the cluster.

So the tag became an integer, found by brute force. The tag is really a template, something like `{routing:v1:<n>}`, and at startup we walk `n` upward from zero, hashing the whole tag each time to see which primary owns the slot it lands in. If that node still has room, keep the integer. If it doesn't, throw it away and try the next one. Stop when every node has as many as we asked for.

What falls out is a list of integers that are known-good addresses: a configured number of them per node, deliberately spread across all of them. Nothing about any particular number is meaningful; it's just the first integer whose hash happened to land on a node that still had a vacancy. Two nodes with two apiece might hand you 1, 2, 3, 5. Ask for three apiece and the next ones might be 8 and 11. The whole answer is a function of the cluster's shape, and it's recomputed deterministically every time the process starts.

</Extra>

<Extra min={3}>

Roughly, at startup:

```go
// Walk the integers, keeping the ones whose hash tag lands on a primary that
// still has room. The numbers mean nothing on their own; they exist to be a
// distribution knob we control instead of one CRC16 controls.
func findAnchors(primaries []NodeID, perNode int) []int {
	anchors := make([]int, 0, len(primaries)*perNode)
	filled := make(map[NodeID]int, len(primaries))

	for n := 0; len(anchors) < cap(anchors); n++ {
		owner := ownerOf(Slot(fmt.Sprintf("routing:v1:%d", n)))
		if filled[owner] >= perNode {
			continue
		}

		filled[owner]++
		anchors = append(anchors, n)
	}

	return anchors
}
```

After which building a key is just a lookup:

```go
func cacheKey(anchors []int, origin, dest h3.Cell, res int) string {
	// The hex pair gets hashed a second time purely as a spreading function:
	// same pair, same anchor, same slot, every time. Different pairs land
	// evenly across the whole list.
	anchor := anchors[int(Slot(origin.String()+dest.String()))%len(anchors)]

	return fmt.Sprintf("{routing:v1:%d}:%s:%s:%d", anchor, origin, dest, res)
}
```

The per-node count is the interesting parameter. One apiece and every batch is enormous and you've re-created the hot spot with extra steps. Hundreds apiece and your batches get small again and you're back to paying per-round-trip.

</Extra>

Once the tag is doing the work, a batch of thousands of keys can be split into a handful of piles, and every pile is a single legal multi-key command aimed at exactly one node.

<Extra min={2}>

## Watching the walk

Reasoning about which integers land where is not something you can do in your head, so here's the walk run for real. Every integer from zero upward gets dropped into the tag, hashed with the same CRC16 Redis uses, and handed to whichever primary owns the slot it lands in. If that primary still has room, the integer is kept; if not, it gets thrown away and the walk moves on to the next one.

<AnchorWalk />

The integers it keeps look arbitrary because they are. There's nothing meaningful about any particular one of them; they're just the numbers whose CRC16 happened to land where I needed it to. Early on nearly everything gets kept, because every primary has room. It's only near the end, when most of the cluster is full and the walk is fishing for the last few seats, that it starts throwing numbers away. Change the number of primaries and the whole answer changes, which is the honest version of what resharding does to a scheme like this.

If you'd rather point this at your own key template and node count, I wrote [a small standalone tool](/tools/redis-cluster-tag-picker.html) that does the same walk and hands you the list, and it's also [a gist](https://gist.github.com/verygoodsoftwarenotvirus/ce5eaa65e26071a5e241ccffa3fd4d12) if you'd rather have your own copy. Everything here runs offline, in the browser.

</Extra>

# Sorting keys before you fan out

<D level={1}>

Collapsing that fan-out fixed the span count, but there was a second problem hiding underneath it.

</D>

<D level={2}>

Collapsing that fan-out fixed the span count, but it mattered for a second reason as well: *which* node a concurrent request lands on decides whether the concurrency does anything at all.

</D>

<D level={3}>

Collapsing that fan-out fixed the span count, but it mattered for a second reason as well. Each Redis node executes commands on a single thread, so twenty concurrent requests aimed at the same node are not twenty concurrent requests, they're a queue with extra allocation.

</D>

<D level={1}>

So we work out where every key is going before any of it leaves the process, and fan out across nodes rather than across arbitrary chunks. Same number of requests, except now they're actually happening at the same time.

</D>

<Extra min={2}>

<DispatchOrder />

</Extra>

<Extra min={2}>

Naively, you take your key list, chunk it, and fan the chunks out across some goroutines. This feels like parallelism and largely isn't. If the chunks aren't organized by destination, several of them will target the same node at the same time, and that node will do them one after another while other nodes sit idle. Your throughput ceiling ends up being whatever your unluckiest node can do serially.

So before anything goes out on the wire, we compute the slot for every key locally, which is just a cheap CRC16, and group by it. Then the fan-out is over *nodes* rather than over arbitrary chunks, and every in-flight request is doing useful work somewhere different.

</Extra>

<Extra min={3}>

```go
// Compute slots locally and bucket by them, so each batch is both
// CROSSSLOT-legal and aimed at a node no other in-flight batch is using.
func groupBySlot(keys []string) map[uint16][]string {
	batches := make(map[uint16][]string)
	for _, k := range keys {
		slot := Slot(k)
		batches[slot] = append(batches[slot], k)
	}

	return batches
}
```

Doing the slot math yourself instead of letting the client discover routing by trial and error is the difference between one round trip per batch and one round trip per `MOVED` redirect you earn along the way.

</Extra>

# MSET doesn't do expiry

Here's the one that genuinely annoyed me. Cached route estimates have to expire: traffic changes, roads close, and a stale estimate is worse than no estimate because you'll trust it.

`SET` takes an `EX` argument. `MSET` does not take anything. There is no `MSETEX`. You can have your bulk write or you can have your TTLs, and Redis will not sell you both.

<D level={1}>

So we stopped asking for a command that doesn't exist and sent Redis a script instead. A few lines of Lua, shipped with `EVAL`, walks the batch and sets each key with its expiry, one round trip, atomic, TTLs intact.

</D>

<Extra min={2}>

The usual workaround is to pipeline a `SET ... EX` per key, which gets you correctness at the cost of turning one command into thousands. Or you can `MSET` and then `EXPIRE` in a second pass, which doubles your commands *and* leaves a window where a crash between the two passes strands keys in the cache forever.

The answer was to stop asking Redis for a command that doesn't exist and send it a script instead. `EVAL` runs Lua on the node, atomically, and the script can do whatever `MSET` refuses to.

</Extra>

<Extra min={3}>

```lua
-- KEYS: every key to write, all in one slot courtesy of the hash tag.
-- ARGV: the values, positionally matched to KEYS, with the TTL last.
local ttl = tonumber(ARGV[#ARGV])

for i = 1, #KEYS do
  redis.call('SET', KEYS[i], ARGV[i], 'EX', ttl)
end

return #KEYS
```

This is only legal because of the hash tag work. Clustered Redis requires that every key a script touches be declared in `KEYS` *and* belong to a single slot, so the same integer-tag scheme that made `MSET` possible is what makes `EVAL` possible. The two changes look unrelated on a PR list and are actually the same change.

Worth doing properly: load the script once with `SCRIPT LOAD` and call it by SHA with `EVALSHA` thereafter, falling back to `EVAL` on `NOSCRIPT`. Otherwise you're shipping the script body over the wire on every single sweep, which is a silly thing to pay for at scale.

</Extra>

# JSON is not free

The last one is embarrassing in hindsight. The cached value started as JSON, because of course it did. It's two numbers, a duration and a distance, wrapped in the most convenient serialization format in the world.

<D level={1}>

Convenient is not the same as cheap when you're decoding it as many times as we are per-pass. The value is CSV now, just `412.3,5120.7`. About a third of the bytes, and reading it is two `ParseFloat` calls instead of a full JSON decode.

</D>

<Extra min={2}>

At our scale, "the most convenient" and "the cheapest" stop being the same thing. Every read meant a full JSON decode, which consumes a meaningful amount of CPU time.

So the value became CSV: `412.3,5120.7`. Smaller, no field names, no reflection, and parsing is a `strings.Cut` and two `strconv.ParseFloat` calls.

</Extra>

<Extra min={3}>

```go
func parseEstimate(s string) (Estimate, error) {
	durStr, distStr, ok := strings.Cut(s, ",")
	if !ok {
		return Estimate{}, fmt.Errorf("malformed estimate %q", s)
	}

	duration, err := strconv.ParseFloat(durStr, 64)
	if err != nil {
		return Estimate{}, fmt.Errorf("parsing duration: %w", err)
	}

	distance, err := strconv.ParseFloat(distStr, 64)
	if err != nil {
		return Estimate{}, fmt.Errorf("parsing distance: %w", err)
	}

	return Estimate{Duration: duration, Distance: distance}, nil
}
```

The smaller payload is a nice bonus on top of the parse savings: less network, less memory in Redis, etc. But the parse cost was the real win, and it's the one I'd have dismissed as premature optimization if I hadn't gone looking at a profile first.

The tradeoff is that you've given up self-description. A positional format means the reader has to know the schema, so a future third field is a migration rather than an addition. We'll cross that bridge when we get there.

</Extra>

# What I'd tell myself at the start

None of this arrived in one piece. It was the product of a lot of inching forward, and every single step was a thing I learned by watching the previous step fail in a way I hadn't predicted.

Being a Go fanatic, I'm naturally reverent of Rob Pike, and in particular, his [5 rules of programming](https://web.archive.org/web/20260318104226/https://www.cs.unc.edu/~stotts/COMP590-059-f24/robsrules.html). Two of them describe exactly how I got here:

> **Rule 2.** Measure. Don't tune for speed until you've measured, and even then don't unless one part of the code overwhelms the rest.
>
> **Rule 3.** Fancy algorithms are slow when *n* is small, and *n* is usually small. Fancy algorithms have big constants. Until you know that *n* is frequently going to be big, don't get fancy.

I took Rule 3 as permission and skipped Rule 2 entirely. I never benchmarked anything, I wrote the simple thing, it was fine on my machine, and I shipped it. What I neglected to contemplate was that in our workloads *n* is not usually small, it's reliably large.

<Extra min={2}>

The part I'd glossed over is that Rule 3 comes with an escape clause: *until you know that n is frequently going to be big*. I did know. What I'd actually done was take a rule of thumb about the general case and apply it to a specific case I had measurements for and hadn't bothered to look at. The huge read times didn't teach me anything our existing dashboards couldn't have told me before I wrote a line of it, and much more cheaply.

Rule 2 is the one that would have caught it, and I think it's usually taught too narrowly. Measuring isn't only for deciding whether something is worth optimizing, it's also for finding out which regime you're in at all. In our workloads *n* is reliably large, and every change in this post came from eventually looking at a number that was already on a dashboard before I started.

The honest reason I skipped it is that measuring used to be work. I cut my teeth in this industry mostly at nascent startups where the default is ship now and fix later, and later shows up as a trace. A benchmark meant a harness, and a harness meant inventing input that resembled production, and all of that meant explaining why a two-point ticket was now a five. I have consequently never developed a benchmarking reflex.

That excuse has a shelf life, and I think it has expired in the post-Claude era of programming. Asking a model for a benchmark is a minute of my time, and generating plausible input at a realistic size is precisely the sort of tedium it's good at. I don't know whether the industry at large has moved on this, and I'd guess the ticket-points argument is as alive as it ever was. But mine has moved completely. The cost of finding out which regime I'm in has dropped far enough that not knowing is a thing I'm choosing now, rather than a thing I'm stuck with.

</Extra>

But the thing I'd actually go back and tell myself has nothing to do with benchmarks. It's that I was carrying the wrong model of Redis around in my head. I thought of it as a map I could talk to over TCP. That's a fine model when you're fetching a user's session by their ID on page load, which is most of what anyone ever uses Redis for. It is a terrible model for what we were doing here, and every problem in this post is a place where the map quietly stopped being the truth.

<Extra min={2}>

The map model isn't wrong so much as it's scoped. It accurately describes one key and one round trip, and it's what every tutorial shows you, because that's the case almost everybody has. Push past it and the parts it was eliding start filing complaints: an `MSET` isn't a map write, it's a command that has to resolve to a single node. Concurrency isn't concurrency if every request lands on the same command thread. A TTL turns out to be a property of a particular command rather than of the store. None of this is obscure, all of it is in the documentation, and none of it ever comes up while you're getting sessions by ID.

I suspect that's the general shape of it rather than anything specific to Redis. The reason an abstraction is worth having is that it hides the machine, and the reason it eventually bites is that it hid the machine. The only reliable tell I've found is volume. Once you're doing something at the scale we operate in, the mental model you picked up doing it once per page load is almost certainly load-bearing in ways it wasn't built for, and it's worth going to read what's actually underneath before production explains it to you.

</Extra>
