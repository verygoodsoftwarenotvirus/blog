---
title: "The End of verygoodsoftwarenotvirus.ru"
date: "2026-09-12T14:22:41-05:00"
author: "verygoodsoftwarenotvirus"
---

Last night, I got a notice that my domain renewal had been rejected by my payment provider (Privacy.com) because my domain provider (101Domain) tried to charge $200 for renewal of `verygoodsoftwarenotvirus.ru`.

<!-- markdownlint-disable MD033 -->
<img src="/endofanera/payment_rejection.png" alt="a declined $199.99 charge to 101Domain, dated September 11 2026, with the reason &quot;Incorrect card details&quot;" style="display: block; margin: 0 auto; width: 45%;">

(note: the real issue behind this transaction was that the underlying card had expired, but it also would have rejected on amount)

If you run `whois verygoodsoftwarenotvirus.ru` right now, you get a few lines that, taken together, are the whole story:

```
created:       2014-11-10T00:34:07Z
paid-till:     2026-11-10T00:34:07Z
free-date:     2026-12-11
state:         REGISTERED, DELEGATED, UNVERIFIED
```

The `UNVERIFIED` in the last line is the problem.

## What actually changed

[Федеральный закон от 29.12.2025 № 569-ФЗ](http://kremlin.ru/acts/bank/52785) was signed at the end of last year, but the part that matters for me took effect on September 1st, eleven days ago as I write this.

At least, that's what I've been able to surmise by asking AIs about it. I don't speak Russian, and this doesn't seem to be some major newsworthy move, but just a routine procedure. From what I can tell, the only way to keep my domain would be to establish some form of Russian connection. I could start a business, invest in one, attempt to emigrate, etc. I love committing to a bit, but that's just a bit too far for my tastes.

My registration is paid through November 10th, 2026. I cannot renew it. On December 11th it goes free, and any person who can satisfy these new requirements can have it. I look forward to seeing what nefarious services are offered by whoever parks the domain next.

## Just so we're clear

I have no connection to Russia whatsoever, and never have. I've never lived or visited there, never had any particular interest in it, don't know the language and don't really care to. I've known this outcome was a possibility for a while. I had briefly dual-deployed this blog to `verygoodsoftwarenotvirus.blog`, but that turned into a $60/year obligation I also wasn't willing to tolerate (some parker has it now). The relationship between my country (America) and Russia has been trending downwards for almost as long as I can remember. I also do not support any government, foreign or otherwise, that indulges in war for any reason.

## Why I bought it in the first place

In 2014 I was a security guard at a condominium complex in Austin, making $11 an hour. I've [written about this era before](/posts/the-story-of-porktrack/), so I'll keep it short: I was newly married, I was not yet a software engineer, and I very badly wanted to become one.

I had a computer in the guardhouse that belonged to the HOA, and was intended for logging package deliveries. I surreptitiously installed Visual Studio and Android Studio on it, and between residents I wrote apps in C# and Java. I'd also installed FileZilla so I could upload stuff to my DigitalOcean droplets.

The programs were strikingly trivial. I wrote one that generated a random math problem and offered you a multiple-choice list of answers. I wrote one that generated random colors. That's really the extent of it, but the feeling of making a computer do something you told it to do is just as intoxicating today as it was then.

## Giovanni

My friend [Giovanni](https://giometric.net) is/was an actual, real-life software engineer, which made him the closest thing I had to a mentor or peer. He's also an exceedingly nice guy, and so offered to use my binaries and try to find bugs for me to solve. I would compile these little apps and email him the binaries in zip folders. He used to joke, more or less, that

> for all I know you've figured out how to make a virus and are sending me one

So I did the only reasonable thing and registered `verygoodsoftwarenotvirus@gmail.com`, so that the next binary would arrive with reassurance attached. On a whim, I figured "why not overcommit to the bit and see if I can buy the domain", and the rest is history.

## What a joke turns into if you leave it alone long enough

I started working as a software engineer the following May. The handle came with me. It's my GitHub username. It's my handle everywhere I do anything programming-adjacent. Whenever people'd ask me about the username, I'd get to say "I own the `.ru`, too." and it always makes them laugh.

## So: two domains

This has all been an incredibly annoying adventure, but I do still want to write things, so I've set up `verygoodsoftwarenotvirus.dev`, which you're probably reading this on now. When the registration lapses in December, the domain stops being mine. So, for the record, here is [a snapshot of this blog from October 16th, 2024](https://web.archive.org/web/20241016063422/https://blog.verygoodsoftwarenotvirus.ru/), living at the address it was born at.

