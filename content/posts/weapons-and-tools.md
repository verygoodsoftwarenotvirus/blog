---
title: 'Weapons and Tools'
date: 2019-02-26T19:04:35-06:00
---

I like to think of myself as a builder of tools. When I build software services, I don't build things that do things, I build tools for doing things with. If I'm tasked with communicating with an external API, I don't just write the raw requests, I write a client for interacting with that external API, so that when the time arises for another person to interact with that same API, it's however much easier than it would have been.

Lately, though, I've taken to indulging in a cruel thought experiment where I try to imagine how I could weaponize whatever tool I'm building. That external API client, given the right circumstances, could be a very precise DDoS mechanism, for instance. Most of the time it's some awkward mental stretch like the aforementioned because I am fortunate to work for a hosting company, so the tools I build are normally pretty specific, and as a consequence, likely not easily weaponized. (I think.)[^1]

A hammer wielded by a trained worker is a tool. A hammer wielded by someone intent on doing harm is a weapon. The hammer requires no metamorphosis yet starts as a tool and ends as a weapon. Therefore, there must be a threshold where the tool becomes a weapon. So, what turns a tool into a weapon?

My first stab at answering this question was that it is misuse which transforms tools into weapons. After all, the hammer was not meant to harm anyone[^2], yet there are an infinite number of ways to misuse a hammer without hurting anybody at all.

In our premise, the hammer wasn't wielded by a fool who didn't know how to use a hammer properly; it was wielded by someone intent on doing harm. Allow our new hypothesis to be that what transforms a tool into a weapon is motivated misuse. To turn a tool into a weapon requires not only its deliberate misuse (weaponization), but also the desire to do so.

That seems satisfactory, but it instantly begs the question in my mind: _Can you design a tool that is impossible to weaponize[^3]?_

Since there are two components required for the weaponization of tools (motive and misuse), can we design tools so that they aren't capable of being misused, thus eliminating the second factor? I feel compelled to say that the answer is yes, and I've been thinking about why.

I'd posit that the statement "some tools are more weaponizable than others" is non-controversially true. A hammer is weaponizable, I think, in part because its purpose is hyper generic. Its purpose is to hit things, ostensibly nails, but not necessarily. There's nothing nail-exclusive about the shape of your run-of-the-mill hammer's head.

The hammer is such a generic tool that someone smart, long (enough) ago, decided, "This thing doesn't do enough," and added a nail puller to the other side. It's a tool so generic that even though it came with two sides of itself, someone decided that was too much hammer by half and invented another thing to replace it.

Can we make the hammer unweaponizable? I think we can get pretty close, but what we'd have wouldn't be called a hammer because nobody would recognize it as such[^4]. Nevertheless, it doesn't take a particularly vivid imagination to conjure up a horror movie where someone befalls a fatality at the hands of a particularly motivated user of the marketed-as-non-weaponizable hammer.

As an aside, I didn't mean to turn this blog post into an advocacy of the complete abolition of weapons via tool redesign[^5], only to illustrate that the line between weapon and tool is quickly and unremarkably crossed. It should be noted that a weaponized hammer has the obvious implication of a sentient being's murder, but you could argue that tools are weaponized to nobody's harm, or even for pure benefit. Chemotherapy is weaponized against cancer cells, scissors are weaponized against excess paper, caffeine is weaponized against poor decision making the night prior.

If you'll grant me one more assumption, I'd like it to be that the more generic a tool's purpose, the more readily weaponized it is.

Our world is simultaneously riddled with tools generic enough to be weaponized and people with the motivation to misuse them. Even more remarkable, to me, is that I'm fortunate enough to be able to spend the majority of my day with the most fascinating and generic tool humanity has ever devised: the computer!

The computer is like the exact opposite of the hammer. It's a tool so generic it can make other tools. It can make tools that help it make tools. It can make tools that help the tools that allow it to make the tools that the tools it makes are trying to make for it. That's cool as heck, but as you'll recall, we've assumed the more generic the tool, the more weaponizable it is (computers are, like, _**super**_ weaponizable, ya'll). Furthermore, there is an entire industry chock-full of folks like me who use these very generic tools to make tools, which we've assumed are also potential weapons.

I'm certain that there is no easy, memorable catchphrase that will bestow upon anyone who hears it the knowledge to make unweaponizable tools. Acknowledging that doesn't absolve our profession of the obligation to ensure that we build safeguards into tools we think might be particularly weaponizable. The moment my thought experiment goes from quirky mental gymnastics challenge to legitimately fear-inspiring is the moment I have a serious talk with my manager.

Engineers at [Google](https://www.nytimes.com/2018/08/16/technology/google-employees-protest-search-censored-china.html) and [Microsoft](https://www.theguardian.com/technology/2019/feb/22/microsoft-protest-us-army-augmented-reality-headsets) have had to take the extraordinary step of publicly registering their fervent opposition to the weaponization of the tools they've developed. That's a great first step, and the braver comrades of those groups have [put their resignation letters where their mouth is](https://theintercept.com/2018/09/13/google-china-search-engine-employee-resigns/). More of that, please.

The weaponization of tools in the pursuit of capital is an inevitable by-product of capitalism, and the morality of that weaponization is inherently unfactored. These engineers' protests may be some of the first we've seen, but they won't be the last. I won't work at the hosting company forever, and students reading this won't be in a position of writing relatively harmless applications under the watchful gaze of a wise academic forever either. At some point, more of us than we're comfortable acknowledging will be asked to build something that has truly horrifying and obvious weaponization opportunities, or even be asked to build literal weapons.

If you're a professional software engineer at any level, that is a scenario you need to think about and reconcile with your morality now, so that you may be firm in your decision later, to whatever consequence.

[^1]: I suppose if your evil scheme involved spinning up thousands of WordPress instances, we'd [be your huckleberry](https://www.youtube.com/watch?v=plD1MbOGLfQ), but spinning up a WordPress server is not generic enough a task to be easily weaponized.
[^2]: ...or is it? Let's assume for the sake of simplicity that it isn’t.
[^3]: It's worthwhile to take the time to point out that regulation in itself is both a tool and weapon. Regulations aiming to prevent the production of meaningful weapons could be weaponized against the developers of tools that either occupy the grey area between tool and weapon or are otherwise capable of marketing to folks as such in order to justify their regulation.
[^4]: In my amateur science fiction imagination, I can picture something the size of a drinking glass that would have some form of smaller-diameter beater inside it that would try to ensure its own surface was as level with the surface of the outer lid as it could manage, applying linearly greater force to the nail head until it determined that progress would not be made.
[^5]: A noble idea, and like most noble ideas, likely naïve.
