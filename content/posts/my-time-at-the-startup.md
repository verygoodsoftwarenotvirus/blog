+++
title = "My time at the startup"
date = "2025-08-08T23:15:56-05:00"
author = "verygoodsoftwarenotvirus"
cover = ""
tags = []
draft = false
keywords = []
description = ""
showFullContent = false
readingTime = true
+++

In summer of 2021, I was looking for something new. I had been working at an auto insurance comparison website company, and had spent the better part of a half a year just sort of dilly dallying around in an official capacity. That company had overhired right before COVID when they raised a huge round, and the company really only had so many endeavors it could reasonably attempt, so I kinda just sat on the sidelines, writing Confluence pages about efforts we knew we weren't going to take when I created the document. They'd also called employees who wanted to keep working from home full time in Early 2021 "entitled," and suffice it to say, I was one of those employees, but I didn't feel like I was being entitled. (In the sli.do for the subsequent all hands, I posited the question if wanting to stay alive was entitled behavior.)

I checked Twitter (which it still was, then), and saw that someone I looked up to in the Go community was asking if anybody was looking for work. How serendipitous! I sent him a DM, and after a short interview process, I got hired at a very nascent company.

(I suppose I should clarify now that I'm not going to name the company in this post. If you know me in real life, you know who they are, probably. Not out of fear of reprisal, I just don't think it lends a whole lot to the story.)

The earliness of the company was the main thing I was looking forward to about the position. I had worked at a bunch of companies, even a small startup, but I had never worked on a codebase that wasn't established, where I wasn't basically just reimplementing existing features or fixing old bugs. This was a chance to get in on the ground floor and build a product from the bottom up, and really flex all the software writing chops I had accumulated over the years. I was so excited for this. 

The company was about 8 people large at that point, had a clear product vision, working MVP, and a small slew of customers. The product was an incident management Slack bot. In the year of our Lord 2025, these sorts of bots are a dime a dozen and some are even homegrown at the companies that use them, but in 2021, terms like Incident Commander were anecdotally just starting to get popularized. You could invoke the bot via a slash command, and it would present a modal to you asking you for details about the incident, and then it would create a channel specifically for that incident and prompt you to start inviting people and assigning roles. 

## Staff

The company was founded by a woman who had worked in Finance for a while. If I recall correctly, she had worked at Goldman Sachs and then Broadstreet. She told me everybody at Broadstreet is given an iPad and they constantly rate you when they interact with you. I had nightmares about that and I never even stepped foot in the building.

I have a ton of respect for this founder, still, even after everything that happened. I told her when I was interviewing that I was taking the job so I could learn about early stage startups, and that I would be bugging her with intrusive questions about the whole process, and she never once balked. Over my tenure I asked her several deeply uncomfortable and awkward questions about the trajectory of the company, and she never once pulled rank or gave some excuse instead of an answer. 

The founder wasn't a programmer in any sense, but had worked with technical teams at prior companies and did have a good general understanding around the challenges software teams face during incidents. Nevertheless, she had also brought in a truly all-star cast of engineering leadership for making an Incident Management app. The head of product had an incredible resume full of leadersihp positions at huge tech companies. He had lived through these kinds of incidents as an IC, and also as a manager. Also, just an exceedingly nice guy. The CTO was the guy that I reached out to for this job. Someone very well respected in the Go community, and in his local city's tech community, someone who had really been through all that.

## First project

My first project once I got on the company was to help build a payments webhook receiver server. Basically, the CTO and CPO had picked out a payment provider, Chargebee, to handle recurring charging of customer cards (because we had paying customers at the time). Chargebee would send us a webhook event once a month when they took payment, and we could use that information to update a column that entitles a team to certain features.

The CTO had come up with this design: the webhook server would be a lambda, triggered by an API gateway, so that we could handle any number of webhook requests that came in. The idea was also that we would eventually use this kind of stack to build new products, and so we were effectively prototyping the foundation of our subsequent features.

Implementation was predicted to take 2 weeks, but it took 4 instead. None of us had ever used API Gateway + Lambda + Terraform before, so there were some kinks to work out. Also, we discovered that the lambda handling the request actually doesn't get access to any headers, so in order to validate the HMAC header, we had to write a second lambda that lived as an API Gateway middleware. Couple that with the aforementioned Terraform confusion, and you blow up your estimate.

## Fallout

The founder was, simply put, not happy. She insisted that none of this was going to go well if we were going to constantly miss estimates like this. She convened a meeting and asked every engineer if there was anything we could have done to speed up the implementation. And to be honest...yeah, there was. I couldn't help but admit that this thing didn't need to live in API Gateway, it didn't need to be a Lambda. Having so many transactions happen that your webhook consumption server needs to scale sounds like a great problem to have, but we didn't have it.

A few weeks later, the founder announced that the CTO had been fired. I felt responsible. The CPO assured me later that whatever contribution I may have inadvertently made was merely the straw that broke the camel's back. He left a month later.

I learned a really important lesson that I maintained for the rest of my tenure there: at an early stage startup, the biggest consideration is implementation speed. 

## Shakeup

About 5 months into the position, more cracks started to show. We had been adding features, iterating like crazy, burning the midnight oil, but we never heard about any new customers signing up. On Hacker News, it seemed like every week since I had joined, someone had posted a "Launch HN: Incident Management Bot in Slack" kind of company. 

Additionally, the founder and the CPO were clearly not getting along. The CTO and CPO had been friends for a long time, so they were both kind of privately comiserating with one another about having to work with her. Eventually she fired them, saying they weren't what we needed anymore. It felt so weird to see someone spend what was probably a lot of time courting the expertise of these two guys, really going after the creamiest of the crop you could afford, and then to discard them like nothing was wild to me.

The founder convened us all and laid bare what we had all suspected: the product wasn't hitting its milestones. Customers were evaluating things like incident.io and firehouse. We were going to be switching the product direction to a more general-purpose Slack productivity bot. The idea was maybe we don't focus on incidents exclusively, maybe we focus on generic workflows, and allow for users to customize a slack channel around a given purpose. The founder told me this was really what she had envisioned for the product all along, but incident management was an easy low-hanging fruit to target early.

The designers had drafted up a selection of proposals, and we all got assigned one and went to work. Back to burning the midnight oil, back to grinding away. Then it happened again. Another 6 months, another floundering product, another change of direction. This time, we weren't going to allow users to use the short code invocation at all, we would instead allow them to configure a small selection of bot actions such that they were triggered by specific emojis

## AI

Another 6 or so months pass, and in the meanwhile, OpenAI releases ChatGPT and opens up the API. If you're a sentient being who was alive then, you know how huge this was. We didn't take it too seriously in the immediate term, but we did pre-configure a bot emoji reaction so it would summarize a thread or the last 24 hours of discussion in a channel. Of the few users we did have, this was the only action that got any positive feedback. At one point, we had to implement LaunchDarkly checks for certain features because some customers hated them so much they wouldn't use the bot unless they were disabled.

Positive signal is positive signal. We quickly reconfigured every emoji reaction so that they were all just different prompts. You could assign the bug emoji to generate a bug report, and we had leftover JIRA integration functionality from the earlier Slack bot days, so we could even create a ticket for you from it. We had one for Marketing flows, one for management reports, etc. A lot of time was spent tweaking prompts and trying to get them to do what we liked. 

## End of the Slack era

Eventually, the fact that the bot had to be installed into a company's Slack was the biggest obstacle to overcome. We would show propsective users features, and they'd put their head in their palms when they saw Slack, because their IT would (rightfully) have a very lengthy and discerning review process that we'd probably not pass.

And so began the 5th iteration of the product: a ChatGPT app for teams. The concept was you would sign in as a team, configure reusable prompts, and then allow users to re-use those prompts for whatever they'd like.

## We're an AI company now

I remember the all hands where they proudly announced that "we are an AI company now." I found the whole suggestions laughable. There was not one GPU in the company's possession. None of the engineers on staff could have told you how to train a model. None of us knew what embeddings were. In what way were we an AI company? Well we used the ChatGPT API, which I guess does have the letters A and I in it. 

If you can't tell, by this time, I had really sort of soured on my job. It felt like we had run out of ideas about 3 products ago, and were just spinning the wheels. I asked the founder in one of our 1:1s once if it was completely out of the question to just return the money to the investors. She told me that was like a death sentence in the VC/founder world. That if a VC gives you $1M, the only better thing to do than spending it all trying to make $10M is to make $10M.

So we trudged on, building a product I wouldn't use if I were paid to, stuck in a 6 month product market fit evaluation loop.

What chapped my ass the most was my most recent assignent: to almost pefectly recreate the ChatGPT experience in our webapp.

See, when you talk to ChatGPT, it "types" back at you. What it's really doing is subscribing to an SSE stream, which each event containing a token of text generated by the AI. Because the results are streaming at you incrementally, it feels like you're talking to someone who is thinking about what they're saying. This was deemed a mandatory feature. 

## Hypocrisy & Delusion

I felt like this clashed so hard with our exisiting ethos at the time. When I implemented a feature allowing you to configure a scheduled slack channel summary, I made it so you couldn't update a channel configuration, only delete and recreate...because it saved time. It allowed us to get the feature out quickly. So updating data you've just created is an acceptable tradeoff, but I have to stream the AI's tokens at a user? Not to mention, this just so obviously wasn't our idea. None of us had thought of an interface like this, we were copying it.

I became deeply unmotivated, and coupled with some sincere depression from my personal life, my productivity tanked hard. I couldn't motivate myself to work hard anymore. Why? So we can throw it away again in 6 months and chase another derivative idea we didn't have?

## Termination

One day, I was coming home from the gym when I got a cell phone call from the founder. I was being let go. She told me "we're not going to be able to compete with OpenAI if we don't iterate quickly enough" and I wasn't even upset enough to laugh. The notion that a series A startup with $5M in the bank was going to compete with the people whose API our product depended on was so farcical it silenced me. I found another job shortly thereafter.

## Personal lives

I remember asking the founder once about her maternity leave plans, because she was a workaholic, and newborns don't appreciate that the way adults do. She told me she intended to take only 2 weeks off and then get back in the saddle, because "`<company>` is my first baby". I wanted to tell her she should take so much longer for the baby that will actually be alive in a year. She ended up taking 4.

## Final thoughts

When I took this job, I had a chunk of lil' startup ideas in my head that I thought I needed to learn the ropes before attempting. On the other side of the experience, I think the main thing I learned is that I don't want to be a VC-funded startup founder. I look at the position the founder was in as one of indebted servitude. People more powerful than her, not through violence or coercion, but a mutual understanding, effectively commanded her to toil away at something, anything that might potentially make money, presumably against her will. I don't think the founder had ever envisioned or desired building the last three products I helped build. The idea that I'd come into it with one idea for something that could make money, prove it effectively wrong, and then be made to constantly remix and reiterate my idea until it approaches something else that might potentially make money, even if it's something I absolutely do not want to do with my time or life? That sucks.
