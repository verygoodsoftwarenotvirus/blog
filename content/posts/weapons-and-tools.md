+++
title = "Weapons and Tools"
date = "2019-02-26T19:04:35-06:00"
author = "verygoodsoftwarenotvirus"
authorTwitter = "vgsnv"
cover = ""
tags = []
keywords = []
description = ""
showFullContent = false
readingTime = true
+++

A hammer wielded by a worker trained to hit things is a tool. A hammer wielded by someone intent on doing harm is a weapon. The hammer requires no metamorphosis yet starts as a tool and ends as a weapon. So, there must be a threshold where the tool becomes a weapon, what is it?

When I write software, I don't build things that do things, I build tools for doing things with. If I'm tasked with communicating with an external API, I don't just write the code for executing raw requests. I write a client for interacting with that external API, and give it an either straightforward or thought-out abstraction. This way, when the time arises for another person to interact with that same API, it's however much easier to do than it would have been.

Lately, though, I've been asking myself how I could weaponize whatever tool I'm building. That external API client, in the hands of someone who knows how to use concurrency well, could be a very precise DDoS tool, for instance. Most of the time my answers are some awkward mental stretch like that, because I'm fortunate to work for a WordPress hosting company. I suppose if your evil scheme involved spinning up thousands of WordPress instances, we'd be your huckleberry.

<!-- markdownlint-disable MD033 -->
<iframe width="560" height="315" src="https://www.youtube.com/embed/plD1MbOGLfQ" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="display: block; margin: 0 auto;"></iframe>

My first stab at answering this question was that misuse transforms tools into weapons. After all, the hammer was not meant to harm anyone, yet there are an infinite number of ways to misuse a hammer without hurting anybody at all. In our premise, however, the hammer wasn't wielded by a fool who didn't know how to use a hammer properly; it was wielded by someone intent on doing harm. Maybe what transforms a tool into a weapon is motivated misuse, which is to say that turning a tool into a weapon requires not only its deliberate misuse (weaponization), but also the desire to do so.

That seems satisfactory, but it instantly begs the question in my mind: _Can you design a tool that is impossible to weaponize[^1]?_

Since there are two hard dependencies for the weaponization of tools (motive and misuse), can we design tools so that they aren't capable of being misused, thus eliminating the second factor? I'd posit that the statement "some tools are more weaponizable than others" is non-controversially true. A hammer is weaponizable, I think, in part because its purpose is relatively generic. Its purpose is to hit things[^2], ostensibly nails, but not necessarily. There's nothing nail-exclusive about the shape of your run-of-the-mill hammer's head.

Can we make the hammer unweaponizable? I think we can get pretty close, but what we'd have wouldn't be called a hammer because nobody would recognize it as such[^3]. Nevertheless, it doesn't take a particularly vivid imagination to conjure up a horror movie where someone befalls a fatality at the hands of a particularly motivated user of the marketed-as-non-weaponizable hammer.

I beat this dead horse only to illustrate that the line between weapon and tool is quickly and unremarkably crossed. It should be noted that a weaponized hammer has the obvious implication of a consequential murder, but you could make the case that tools are weaponized to nobody's harm, or even for pure benefit, all the time. Chemotherapy is weaponized against cancer cells, scissors are weaponized against excess paper, caffeine is weaponized against poor decision making the night prior.

Our world is simultaneously riddled with tools generic enough to be weaponized and people with the motivation to misuse them. Even more remarkable, to me, is that I'm fortunate enough to be able to spend the majority of my day with the most fascinating and generic tool humanity has ever devised: the computer!

The computer is a bit like the hammer, only several orders of magnitude deeper. It's a tool so generic it can make other tools. It can make tools that help it make tools. It can make tools that help the tools that allow it to make the tools that the tools it makes are trying to make for it. That's cool as heck, but as you'll recall, we've assumed the more generic the tool, the more weaponizable it is (computers are, like, _**super**_ weaponizable, ya'll). Furthermore, there is an entire industry chock-full of folks like me who use these very generic tools to make tools, which we've assumed are also potential weapons.

I'm certain that there is no easy, memorable catchphrase that will bestow upon anyone who hears it the knowledge to make unweaponizable tools. Acknowledging that doesn't absolve our profession of the obligation to ensure that we build safeguards into tools we think might be particularly weaponizable. Engineers at [Google](https://www.nytimes.com/2018/08/16/technology/google-employees-protest-search-censored-china.html) and [Microsoft](https://www.theguardian.com/technology/2019/feb/22/microsoft-protest-us-army-augmented-reality-headsets) have had to take the extraordinary step of publicly registering their fervent opposition to the weaponization of the tools they've developed. That's a great first step, and the braver comrades of those groups have [put their resignation letters where their mouth is](https://theintercept.com/2018/09/13/google-china-search-engine-employee-resigns/). More of that, please.

These engineers' protests may be some of the first we've seen, but they won't be the last. I won't work at the hosting company forever, and students won't be in a position of writing relatively harmless applications under the critical gaze of an academic forever either. At some point, more of us than we're comfortable acknowledging will be asked to build something that has truly horrifying and obvious weaponization opportunities, or even be asked to build literal weapons. If you're a professional software engineer at any level, that is a scenario you need to think about and reconcile with your morality now, so that you may be firm in your decision later, to whatever consequence.

[^1]: It's worthwhile to take the time to point out that regulation in itself is both a tool and weapon. Regulations aiming to prevent the production of meaningful weapons could be weaponized against the developers of tools that either occupy the grey area between tool and weapon or are otherwise capable of marketing to folks as such in order to justify their regulation.
[^2]: The hammer is such a generic tool that someone smart, long (enough) ago, decided, "This thing doesn't do enough," and added a nail puller to the other side. So even though the hammer came with two sides of its primary function, someone decided that was too much hammer by half and invented another thing to replace it.
[^3]: In my amateur science fiction imagination, I can picture something the size of a shot glass that would have some form of smaller-diameter beater inside it that would try to ensure its own surface was as level with the surface of the outer lid as it could manage, applying linearly greater force to the nail head until it determined that progress would not be made.
