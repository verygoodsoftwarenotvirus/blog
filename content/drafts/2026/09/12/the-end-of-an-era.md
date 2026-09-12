---
title: "The End of an Era"
date: "2026-09-12T14:22:41-05:00"
author: "verygoodsoftwarenotvirus"
---

If you run `whois verygoodsoftwarenotvirus.ru` right now, you get a few lines that, taken together, are the whole story:

```
created:       2014-11-10T00:34:07Z
paid-till:     2026-11-10T00:34:07Z
free-date:     2026-12-11
state:         REGISTERED, DELEGATED, UNVERIFIED
```

The first line is a Sunday evening in Austin, Texas. The last line is the problem. The two in the middle are the clock.

## The disclaimer I shouldn't have to write

I have no connection to Russia. None. No family, no lineage, no investments, no heritage I've quietly been sitting on. I've never been there. I never learned the language and was never especially curious about it. I do not support the Russian government or its leadership, and nothing about my owning this domain was ever a statement about any of that.

I bought a `.ru` domain for the same reason anybody buys a weird ccTLD: it was cheap, it was available, and it made a joke land. That's the entire political content of the last twelve years of my internet identity.

I'll say the other part too, since it's honest: I always assumed this would end. The relationship between the two countries has been pointed in one direction for a long time, and anybody holding a novelty `.ru` has been holding it on borrowed time whether they thought about it or not. Mostly I didn't think about it. What surprises me isn't that it's over. It's that I got twelve years.

## The guardhouse

In 2014 I was a security guard at a condominium complex in Austin, making $11 an hour. I've [written about this era before](/posts/the-story-of-porktrack/), so I'll keep it short: I was newly married, I was not yet a software engineer, and I very badly wanted to become one.

What I had was a guardhouse computer and a lot of uninterrupted time. The machine belonged to a property management company and was intended for logging package deliveries. I had improperly installed Visual Studio on it, and between residents I wrote C#.

I did not stop at Visual Studio. Android Studio went on there too, so I could make little Android apps. Then FileZilla, so I could push things up to a DigitalOcean droplet. By the end I had quietly assembled, on a computer whose actual job was to record when the plumber showed up, a complete and entirely unauthorized development environment: an IDE for desktop, an IDE for mobile, and a way to put the results on the internet.

The programs were not good. I wrote one that generated a random math problem and offered you a multiple-choice list of answers. I wrote one that generated random colors. That's it. That's the portfolio. Nobody needed either of these things, least of all me. But I had made the computer do something, and at 2 AM in a guardhouse that felt enormous.

## Giovanni

My friend Giovanni was an actual working software engineer, which made him the closest thing I had to a professional peer, which made him the recipient of everything I made. I would compile these little apps and email him the binaries. Not the source. The binaries. I was so proud of them that it did not occur to me that emailing a man an unsolicited `.exe` is, in context, a threatening act.

He eventually pointed this out. The line, more or less, was:

> for all I know you've figured out how to make a virus and are sending me one

Which is correct! That is exactly what receiving my emails looked like from the outside. So I did the only reasonable thing and registered `verygoodsoftwarenotvirus@gmail.com`, so that the next binary would arrive with reassurance attached.

And then, because a bit is only worth doing if you're willing to overcommit to it, I bought the domain. The plan — the entire plan, the whole business case — was to one day host a zip file at `verygoodsoftwarenotvirus.ru` and tell Giovanni to download it.

This was not an idle fantasy, incidentally. That's what the FileZilla was for. I already knew how to get a file onto a server and hand somebody a link to it. I had the delivery mechanism before I had anything worth delivering, which in retrospect describes most of my twenties.

I don't remember whether I ever actually did it. I remember buying the domain to make it possible.

## What a joke turns into if you leave it alone long enough

I started working as a software engineer the following May. The handle came with me. It's my GitHub username. It's my handle everywhere I do anything programming-adjacent. It is, at this point, more recognizable as me than my legal name is in most of the rooms I'm in.

The best part was never the name, though. The best part was the follow-up. People learn the username, they smile, and then I get to say:

"I own the `.ru`, too."

And their eyes go wide. Every time. Twelve years, hundreds of people, one hundred percent hit rate. I have never had to explain the joke — the joke explains itself, and then the domain is the punchline that proves I meant it. It's the single best return on investment I have ever gotten for what I think was about eight dollars.

## What actually changed

[Федеральный закон от 29.12.2025 № 569-ФЗ](http://kremlin.ru/acts/bank/52785) was signed at the end of last year, but the part that matters for me took effect on September 1st — eleven days ago as I write this.

It's worth being precise, because the shorthand version going around ("foreigners can't own `.ru` domains anymore") isn't quite what the text says. What it establishes is mandatory identification of domain administrators through Госуслуги, Russia's unified government services portal, via its ЕСИА identity system. From September 1st forward, you cannot register a domain, renew a domain, transfer a domain, change its administrator, or even change its NS records without a verified account there.

There's no carve-out for people who already had one. There's no grandfather clause.

And a verified Госуслуги account requires, functionally, being a person the Russian state can identify — a citizen, or a foreigner with a residence permit or work patent. I am a guy in Texas. I am not going to have one of those. That `UNVERIFIED` in my whois record isn't an oversight I can go fix this weekend; it's a permanent property of me.

So the practical effect is the same as the shorthand, even if the mechanism is more bureaucratic than a ban. My registration is paid through November 10th, 2026 — twelve years to the day from when I bought it, because I have always renewed in twelve-month blocks and never thought about it again. I cannot renew it. On December 11th it goes free, and somebody else can have it.

I find the tidiness of those dates a little unbearable. It gets to be exactly twelve years old and not a day more.

## So: two domains

I've bought `verygoodsoftwarenotvirus.dev`, and this blog now publishes to both it and the `.ru` out of the same pipeline, for as long as the `.ru` keeps resolving. Nothing you've bookmarked breaks today. Update it anyway — `blog.verygoodsoftwarenotvirus.dev` is where this lives now, and the old one has a hard expiration date on it.

## For the record

When the registration lapses in December, the domain stops being mine, and so does the evidence that it ever was. Somebody will pick it up — it's a good domain — and at some point a person is going to follow an old link expecting me and find whatever they've put there instead.

So, for the record, here is [a snapshot of this blog from October 16th, 2024](https://web.archive.org/web/20241016063422/https://blog.verygoodsoftwarenotvirus.ru/), living at the address it was born at. Proof it was real, and proof it was mine, filed somewhere no registrar can revoke.

There's something appropriately on-brand about a story bracketed by two machine-generated records — a whois entry at one end and a Wayback capture at the other. I don't think I know how to be sentimental in a format that isn't plaintext.

## One last thing

I also bought `verygoodsoftwarenotvirus.zip`, which I'll admit doesn't hit the same. Nobody's eyes widen at a `.zip`.

Although — and I only realized this while writing this post — the original plan, the actual stated purpose for buying a domain in 2014, was to host a zip file on it and send my friend the link. I've now owned the punchline domain for twelve years without ever using it that way, and on my way out I have accidentally purchased the exact TLD that the bit was always about.

I should probably put a zip file on it.
