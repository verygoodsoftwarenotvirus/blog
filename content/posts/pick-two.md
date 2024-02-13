+++
title = "Pick two"
date = "2023-11-07T23:09:12-05:00"
author = "verygoodsoftwarenotvirus"
cover = ""
tags = []
keywords = []
description = ""
showFullContent = false
readingTime = true
+++

There’s a famous adage in the world of laptop purchasing that goes “Fast, Light, Cheap: pick two.” If a laptop is fast and light, it’s not cheap. If a laptop is cheap and fast, it’s not light. If a laptop is cheap and light, it’s not fast. 

I’d like to propose a similar set of tradeoffs for programming languages:

- Productive
- Legible
- Efficient

I’ll explain why you can most often only pick two.

### Caveat

The initial laptop metaphor is, frankly, more subjective than we’d like. What’s “light” to me, might not be to you, what’s “cheap” to you might not be to me, and “fast” is an inherently moving target. Laptops that are describable as “light and cheap” today were “fast” five years ago. Someone who does a ton of video editing might call the laptop your grandma is consistently impressed by “slow.” Nobody’s opinion is worth getting upset over, probably, least of all those posted on the internet.

### Productive

When I say “productive”, I mean two things: learning curve, and library availability. I’d define productive as “how fast can I go from fairly simple idea to functional prototype.” I think both parts of this are necessary factors, as even if I have a library that does what I need it to do in the immediate term of a simple prototype, if the post-prototype learning curve is steep, I wouldn’t feel productive. Additionally, if a language is fairly easy to learn, then the odds are higher that developers will use it to solve problems, and libraries are a sort of inevitable consequence of users solving similar problems consistently. 

These two facets can form a flywheel of sorts, where the more folks that learn a given language, the more choice of libraries there are, the more that folks who don’t already know the language perceive it as approachable and productive.

Library choice is also effectively useless on its own if using those libraries is cumbersome. Package managers go a long way towards making a programming language feel productive, but sometimes those package managers are undercut by broader ecosystem decisions made by the stewards of the language.

### Legible

This is fairly self-explanatory, but also subjective. If you have a heavy academic math background, something like Haskell or Prolog might be more legible than someone without that background. This isn’t just a matter of meaningful character count, but also one of structure. Languages like Ruby or Python are often described as those which even non-programmers can read through and suss out what’s happening, but you could contrive examples that would confuse such a person.

Legibility has a big impact on Productivity, in the sense that the more legible a language is, the easier it will be to come back to old code and improve it when the need arises.

### Efficient

Efficiency is a matter of how performant the end code comes out. This is sometimes impacted by productivity, in the sense that some languages are more efficient the more you know about them, the more performant the resulting code will be. 

### Why pick two?

The more dogmatic of you readers may already have steam erupting from your ears, yielding teakettle noises to those nearby, so let me calm you down a bit: of course there are going to be situations in which you feel as though you don’t have to eschew one of these properties. There are niches in programming which limit your programming language selection, and within that subset, you may feel that you’ve ended up with by far the most legible choice of those options, such that it satisfies the category.

I think in general, though, optimizing towards one outcome can take away from another. A highly efficient language is often so because it has a wide array of operators and/or reserved keywords which yield efficient output, which can tend to take away points from legibility and productivity. A highly legible language is probably going to eschew efficiency in favor of that legibility. A language could be fairly legible and efficient, but never really get the traction necessary to have a large ecosystem of readily-available dependencies.
