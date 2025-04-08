+++
title = "AI as a means of evading accountability"
date = "2025-04-08T11:04:56-05:00"
author = "verygoodsoftwarenotvirus"
cover = ""
tags = []
draft = false
keywords = []
description = ""
showFullContent = false
readingTime = true
+++

There’s no doubt in my mind that the unifying characteristic of modern leadership is evasion of accountability and dereliction of responsibility. We’ve seen it in politics for probably as long as the sport has existed, but the recent Signal debacle was really a shining example of this trend. If I, as an employee of a private S-corp, discussed anything nearly as sensitive or detailed about my company’s inner dealings on a Signal group that had a lurking journalist, I’d be fired and at best have to take some lesser position for the rest of my career, but if you’re willing to fellate a dementia-addled billionaire, you will face zero consequences. Lack of accountability is hot right now, and it’s only getting hotter.

Speaking of work, recently the company I work for hired a new CTO, whose introductory statement to the company included a commitment to “jump start our usage of AI” at the company. They set a humble goal of merely having AI write most of our tests as well as implement new features by the end of the year. Setting goals we won’t meet is old hat for the company, but its fetishization of AI is comparatively new, though not uncommon. AI has become the hot topic that every company must acknowledge, lest they be regarded as ignorant. Every CEO that might emphasize how their company is meeting the needs of its customers in order to have those customers delightfully return to you in the future is met with a “who gives a fuck, how are you shoehorning LLMs into every layer of your operation?”

I find the whole thing laughable. The reason features are slow to develop at the company I work at is, simply put, not because of implementation speed. An LLM is going to have just as hard a time gettings accurate requirements out of an offshored product manager as a human being will.

The lack of accountability trend is older, but AI allows it to propagate, and in a way enforces it. Let’s say my company did somehow manage to write a feature with AI, who is going to be in the Zoom call when it doesn’t work as expected? Who is going to be held accountable when it’s not delivered on time because the LLM didn’t account for edge case X or stipulation Y? Who will be in the postmortems when the service it builds goes down? Will the AI be the incident commander?

I saw a post on BlueSky today about a new-to-me command of the docker CLI: `docker ai`.

<blockquote class="bluesky-embed" data-bluesky-uri="at://did:plc:e5nncb3dr5thdkjir5cfaqfe/app.bsky.feed.post/3lmaccuzqps2u" data-bluesky-cid="bafyreihnlylxkh6xubqvydgknpuqrts6yxkomxozr4fij2maz4seiwkm3e" data-bluesky-embed-color-mode="dark"><p lang="en">god save us from ourselves<br><br><a href="https://bsky.app/profile/did:plc:e5nncb3dr5thdkjir5cfaqfe/post/3lmaccuzqps2u?ref_src=embed">[image or embed]</a></p>&mdash; Xe (<a href="https://bsky.app/profile/did:plc:e5nncb3dr5thdkjir5cfaqfe?ref_src=embed">@xeiaso.net</a>) <a href="https://bsky.app/profile/did:plc:e5nncb3dr5thdkjir5cfaqfe/post/3lmaccuzqps2u?ref_src=embed">April 7, 2025 at 10:41 AM</a></blockquote><script async src="https://embed.bsky.app/static/embed.js" charset="utf-8"></script>

You can do things like `docker ai run redis`, and it will run commands for you, without telling you the output:

<blockquote class="bluesky-embed" data-bluesky-uri="at://did:plc:e5nncb3dr5thdkjir5cfaqfe/app.bsky.feed.post/3lmcqpqs2zs2h" data-bluesky-cid="bafyreifde2viffm7szt65eq64fgrpf7aehwqggcbzzub3gtothpunp7knu" data-bluesky-embed-color-mode="dark"><p lang="en">Tried it on my work machine and it was able to create a Redis deployment. The prompt I gave was &quot;set the password to hunter2&quot; and it did not. The more horrifying part is that when I asked it to clean up the deployment it asked if it could remove a deployment WITHOUT SHOWING THE ARGUMENTS TO THE TOOL<br><br><a href="https://bsky.app/profile/did:plc:e5nncb3dr5thdkjir5cfaqfe/post/3lmcqpqs2zs2h?ref_src=embed">[image or embed]</a></p>&mdash; Xe (<a href="https://bsky.app/profile/did:plc:e5nncb3dr5thdkjir5cfaqfe?ref_src=embed">@xeiaso.net</a>) <a href="https://bsky.app/profile/did:plc:e5nncb3dr5thdkjir5cfaqfe/post/3lmcqpqs2zs2h?ref_src=embed">April 8, 2025 at 10:04 AM</a></blockquote><script async src="https://embed.bsky.app/static/embed.js" charset="utf-8"></script>

Who is going to be fired when the company discovers straggler Kubernetes clusters running myriad abandoned services that don’t even serve traffic, but do consume compute? AI allows the C-suite to take credit for pace of innovation, and mandates that human beings pay the prices for their failings.

For whatever it’s worth, I actually love writing code with the assistance of LLMs, and the “thinking” models fascinate me more than I care to admit. They’re really useful assistants (keyword), and they may even one day be capable of doing the things the aforementioned CTO insisted were possible today, in simpler cases, but every experience I’ve ever had professionally tells me that the vast majority of productivity failures at companies are simply not because developers don’t write code fast enough.

And what of the Juniors? I got my start in this industry by learning how to code during every free bit of time I had, and then taking a relatively low-paying position at a startup doing precisely the kinds of tasks we’re delegating to soulless robots today. Are programmers destined to be the factory workers of tomorrow, in that we’ll be replaced by machines, and only a few very experienced workers will be necessary to fill in the gaps those machines leave behind?

Johnny Boursiquot summarizes my thoughts on this succinctly:

<blockquote class="bluesky-embed" data-bluesky-uri="at://did:plc:6llarrzjnwvveibfai2n3lvp/app.bsky.feed.post/3ljqhayxffs23" data-bluesky-cid="bafyreidug7d3q5zazlklgdw743aed5widvok7233jcggn5sxmq3szyxqxq" data-bluesky-embed-color-mode="dark"><p lang="en">If you&#x27;re a Senior+ Software Engineer today, you&#x27;re among the last of your kind. 

Think about that for a minute.</p>&mdash; Johnny Boursiquot  (<a href="https://bsky.app/profile/did:plc:6llarrzjnwvveibfai2n3lvp?ref_src=embed">@jboursiquot.com</a>) <a href="https://bsky.app/profile/did:plc:6llarrzjnwvveibfai2n3lvp/post/3ljqhayxffs23?ref_src=embed">March 6, 2025 at 3:36 PM</a></blockquote><script async src="https://embed.bsky.app/static/embed.js" charset="utf-8"></script>
