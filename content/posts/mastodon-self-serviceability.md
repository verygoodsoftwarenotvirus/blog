---
title: "What is Self-Hostable, anyhow?"
date: 2022-04-24T16:54:32-06:00
draft: true
---

## Context

I write this article only about a week or so after [an apparently thwarted effort by a certain cult billionaire to purchase a certain social network](https://www.nytimes.com/2022/04/19/technology/elon-musk-twitter.html). On [my own (wretched) Twitter feed](https://twitter.com/vgsnv), I saw a noticeable uptick in folks either reiterating their Mastodon addresses or registering new ones, in anticipation of such a takeover not being thwarted. Some maintained that while the news played a role in their decision, its role was merely as catalyst for larger contemplation on the role of corporations and corporate instruments in what they ultimately feel is a tool for self-expression. The main Mastodon account provides the perfect exhibit:

<blockquote class="twitter-tweet"><p lang="en" dir="ltr">It&#39;s time to <a href="https://twitter.com/joinmastodon?ref_src=twsrc%5Etfw">@joinmastodon</a> <a href="https://t.co/ZjzQT0eGPn">https://t.co/ZjzQT0eGPn</a></p>&mdash; Mastodon (@joinmastodon) <a href="https://twitter.com/joinmastodon/status/1517170696631328770?ref_src=twsrc%5Etfw">April 21, 2022</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

I'm amenable to these arguments. I use my Twitter feed to vent on the state of things, to brag about minor victories, and occasionally bemoan some nearly invisible speck on my otherwise highly privileged and blessed life. I've had a Mastodon account on one of the major providers for a few years, though I certainly haven't used it nearly as much as I've used Twitter. In fact, my current Twitter account is the second or third iteration of it, because I have fully deactivated and deleted that account a few times now.

One of the primary bulletpoints Mastodon advocates like to wheel out is that you can self-host Mastodon. To reference the formal Mastodon account some more:

<blockquote class="twitter-tweet"><p lang="en" dir="ltr">Developed by a German non-profit, Mastodon is essentially a framework that allows communities, individuals and organizations to self-host interoperable social media - a decentralized social network.</p>&mdash; Mastodon (@joinmastodon) <a href="https://twitter.com/joinmastodon/status/1514575464978857984?ref_src=twsrc%5Etfw">April 14, 2022</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

<blockquote class="twitter-tweet"><p lang="en" dir="ltr">You can self-host a Mastodon server</p>&mdash; Mastodon (@joinmastodon) <a href="https://twitter.com/joinmastodon/status/1286737657138155520?ref_src=twsrc%5Etfw">July 24, 2020</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

## What does it mean to be self-hostable

I've been familiar with the self-hosted software scene for most of my career, and that class of software was what I have been principally interested in building and open sourcing. There's a small but earnest community behind this type of software, with [a GitHub "Awesome"-style list repo](https://github.com/awesome-selfhosted/awesome-selfhosted) and even [a subreddit](https://www.reddit.com/r/selfhosted/).

I find it funny, though, that you can very easily nerd snipe a HackerNews thread with a half-hearted argument about what is or is not Open Source software, we've all seemed to accept that the only real distinction that makes something self-hostable is whether or not you can operate it on your own. [The Wikipedia article for the term](https://web.archive.org/web/20220323212346/https://en.wikipedia.org/wiki/Self-hosting_(web_services)) is three sentences long. There are no established quality standards. Much of this software is written in PHP or Python, and the vast majority of it completely abstains from unit or integration testing. I'm not saying that software written without tests in dynamic languages can't ever be good, I'm merely acknowledging the much more likely case that it is very, very bad.

## Considerations exclusive to Self-Hosted software

If you're operating a standard service meant to be run by a corporation with paid staff, as most software in the world is run I'd argue, then you stick to a battle-tested series of best practices for everything from how and where you store information, to how users recover things like accounts. Self-hosted software has to somehow manage to account for the most frequent user cases, as well as the rarer corner cases for admins. In the self-hosted software I've written in the past, for instance, I mandated that any registered users also set up 2FA, because I couldn't reliably guarantee that whoever was running these services would also set up something like [fail2ban](https://www.fail2ban.org/wiki/index.php/Main_Page) on the machine. Mastodon doesn't go this far, that I know of, so I'm expecting there to be some set of tooling that allows admins to be nimble when things get messy.

## A proposed rubric

I think there are certain areas we can rank the quality of self-hosted software:

- **Code Availability**

A very self-hostable project has not just an open source code repository, but a responsive contributor community behind it. It doesn't have to have a current development focus, or even a broader vision for the future, but it should have a place where I can report bugs and ask questions. Mastodon achieves this with [Github Issues](https://github.com/mastodon/mastodon/issues), and has an active community.

- **Cost**

A very self-hostable project can run on the smallest possible machine an operator could rent from an infrastructure provider. For the purposes of this article, I'm ranking that as [a $5 DigitalOcean droplet](https://www.digitalocean.com/products/droplets).

- **Operability**

A very self-hostable project will make it easy to determine the service's health, and easy to troubleshoot outages or errors. As mentioned above, it should have a place where operators can ask clarifying questions and debug troublesome output.

- **Dependency Flexibility**

A very self-hostable project is as plug-and-play as is reasonable. That is to say, if I am an operator who is already running a Postgres instance for one reason or another, and I decide I want to self-host your application, it should be possible for that application to satisfy its database requirements with said Postgres instance.

## What does it mean to self-host Mastodon?

I'm interested in seeing how Mastodon stands up to these metrics, so I will be deploying a Mastodon instance and ranking it for each category. I may do so for other self-hosted software if there is any real interest in it.

## Running Mastodon

Mastodon proper have [their own docs page on how to self-host a Mastodon instance](https://docs.joinmastodon.org/user/run-your-own/). I'm going to be following along with that exclusively and taking notes here as I go along.

They support a [1-Click App Install](https://marketplace.digitalocean.com/apps/mastodon) via [DigitalOcean's Marketplace](https://marketplace.digitalocean.com/). Clicking on the `Create Mastodon Droplet` button leads to a Create Droplet page that has a $48/month droplet pre-selected:

![](/07-mastodon-self-serviceability/one-click-mastodon-create-page.png)

Clicking on a few other marketplace apps, as well as the plain `Create Droplet` button in the DigitalOcean dashboard, that seems to simply be DigitalOcean's default selection for droplet size. Nice try, DigitalOcean.

I changed the selection to a Basic plan $5/month droplet ("Regular with SSD" as opposed to "Premium Intel|AMD"). I select NYC 1 as the datacenter.

When you create the droplet via the 1-Click process, you end up with a little button on the droplet that says `Get Started` with the Mastodon logo:

![](/07-mastodon-self-serviceability/newly-created-mastodon-droplet.png)

Clicking on it reveals the same information on the section of the Marketplace entry titled `Getting started after deploying Mastodon`. It says I'll need a domain name, SMTP credentials, and (optionally) S3 credentials. Like any good software engineer with a web focus, I've got a few domain names at my disposal, so we're using `www.pizzagoblin.com` for this. I've also got a SendGrid account, which I'll gladly sacrifice for this experiment. I'm going to see how optional the S3 credentials are, despite having ready access to some.

Here's the output of the first login session:

```
vgsnv@pop-os:~$ ssh -i ~/.ssh/digitalocean root@157.245.140.40
Welcome to Ubuntu 18.04.4 LTS (GNU/Linux 4.15.0-91-generic x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/advantage

 System information disabled due to load higher than 1.0

323 packages can be updated.
243 updates are security updates.



                        ,----,__    __---''--___
                     ,-'   ,-'\ '--'
            ,       /   O      \
           <_'---__/-       '-_/
             '--___--
                  /   ,
            _   _/  ,''--__-''-_
           / '-'   ;            '-_
           '--__--'                \        ;
                                    ;      /--__
                                    |     ; ;
                                    |     | ;
                                    |     | ;
                                    |     | ;
                                    |     | ;
                                   /ooo___|''

Welcome to Mastodon!

The documentation is available at https://docs.joinmastodon.org

You can restart Mastodon with:

 * sudo systemctl restart mastodon-web
 * sudo systemctl restart mastodon-streaming
 * sudo systemctl restart mastodon-sidekiq

Mastodon is installed under /home/mastodon/live. To browse or change the
files, login to the mastodon system user with:

 * sudo su - mastodon

You can browse error logs with:

 * sudo journalctl -u mastodon-web

Booting Mastodon's first-time setup wizard...
Welcome to the Mastodon first-time setup!
Domain name: www.pizzagoblin.com
Do you want to store user-uploaded files on the cloud? No
SMTP server: smtp.sendgrid.net
SMTP port: 587
SMTP username: YXBpa2V5
SMTP password:
SMTP authentication: plain
SMTP OpenSSL verify mode: fail_if_no_peer_cert
E-mail address to send e-mails "from": Mastodon <notifications@www.pizzagoblin.com>
Send a test e-mail with this configuration right now? Yes
Send test e-mail to: you@wish@i@were@that@dumb.com
E-mail could not be sent with this configuration, try again.
SSL_connect returned=1 errno=0 state=error: certificate verify failed (self signed certificate in certificate chain)
Try again? no
Great! Saving this configuration...
Booting up Mastodon...
It is time to create an admin account that you'll be able to use from the browser!
Username: admin
E-mail: you@wish@i@were@that@dumb.com
You can login with the password: 2b24f20b585d9d12a73d6b6e2634bc75
The web interface should be momentarily accessible via https://www.pizzagoblin.com/
Launching Let's Encrypt utility to obtain SSL certificate...
Saving debug log to /var/log/letsencrypt/letsencrypt.log
Plugins selected: Authenticator webroot, Installer None
Enter email address (used for urgent renewal and security notices) (Enter 'c' to
cancel): c
An e-mail address or --register-unsafely-without-email must be provided.
```

I had a moment of panic during the SMTP section of this wizard. The bullet points in the Getting Started section of the 1-click app said `SMTP credentials for sending e-mails (this can be SparkPost, Sendgrid, Mailgun, etc)`, but I sort of just assumed an API key would be required of me. I was able to find [this guide](https://docs.sendgrid.com/f you've lost whatever game you thought you were playing in addition to the one you actually were.

I hit cancel on the email address thing, only now I'm not sure how to run this utility again. It said "The web interface should be momentarily accessible via https://www.pizzagoblin.com", and then it shut down on me and never even started the service. As far as I can tell, the actual definition for the 1-click install app isn't available in any of the Mastodon repositories, for some reason.

There are no specific details of how to set up Sendgrid in the Mastodon docs, but I was able to find [this guidance](https://github.com/yogthos/cheatsheets/blob/master/mastodon.social.md). I destroy this droplet and recreate it, this time pushing through when it asks me for the relevant email details. Here was the output (minus some fluff I left in the last chunk of output):

```
Booting Mastodon's first-time setup wizard...
Welcome to the Mastodon first-time setup!
Domain name: www.pizzagoblin.com
Do you want to store user-uploaded files on the cloud? No
SMTP server: smtp.sendgrid.net
SMTP port: 587
SMTP username: apikey
SMTP password:
SMTP authentication: plain
E-mail address to send e-mails "from": Mastodon <notifications@www.pizzagoblin.com>
Send a test e-mail with this configuration right now? Yes
Send test e-mail to: you@wish@i@were@that@dumb.com
E-mail could not be sent with this configuration, try again.
550 The from address does not match a verified Sender Identity. Mail cannot be sent until this error is resolved. Visit https://sendgrid.com/docs/for-developers/sending-email/sender-identity/ to see the Sender Identity requirements

Try again? no
You can login with the password: a82d8f5742e697c0c77989afb798dc9f
The web interface should be momentarily accessible via https://www.pizzagoblin.com/
Launching Let's Encrypt utility to obtain SSL certificate...
Saving debug log to /var/log/letsencrypt/letsencrypt.log
Plugins selected: Authenticator webroot, Installer None
Enter email address (used for urgent renewal and security notices) (Enter 'c' to
cancel): you@wish@i@were@that@dumb.com

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
Would you be willing to share your email address with the Electronic Frontier
Foundation, a founding partner of the Let's Encrypt project and the non-profit
organization that develops Certbot? We'd like to send you email about our work
encrypting the web, EFF news, campaigns, and ways to support digital freedom.
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
(Y)es/(N)o: Y
Obtaining a new certificate
Performing the following challenges:
http-01 challenge for www.pizzagoblin.com
Using the webroot path /home/mastodon/live/public for all unmatched domains.
Waiting for verification...
Cleaning up challenges

IMPORTANT NOTES:
 - Congratulations! Your certificate and chain have been saved at:
   /etc/letsencrypt/live/www.pizzagoblin.com/fullchain.pem
   Your key file has been saved at:
   /etc/letsencrypt/live/www.pizzagoblin.com/privkey.pem
   Your cert will expire on 2022-07-24. To obtain a new or tweaked
   version of this certificate in the future, simply run certbot
   again. To non-interactively renew *all* of your certificates, run
   "certbot renew"
 - Your account credentials have been saved in your Certbot
   configuration directory at /etc/letsencrypt. You should make a
   secure backup of this folder now. This configuration directory will
   also contain certificates and private keys obtained by Certbot so
   making regular backups of this folder is ideal.
 - If you like Certbot, please consider supporting our work by:

   Donating to ISRG / Let's Encrypt:   https://letsencrypt.org/donate
   Donating to EFF:                    https://eff.org/donate-le

Created symlink /etc/systemd/system/multi-user.target.wants/mastodon-web.service → /etc/systemd/system/mastodon-web.service.
Created symlink /etc/systemd/system/multi-user.target.wants/mastodon-streaming.service → /etc/systemd/system/mastodon-streaming.service.
Created symlink /etc/systemd/system/multi-user.target.wants/mastodon-sidekiq.service → /etc/systemd/system/mastodon-sidekiq.service.
```

With that, I have a service:
![](/07-mastodon-self-serviceability/it_works.png)

I tried to sign up for a plain user account, just to toy around, only to be greeted with a page indicating that I need to check my email for further instructions. This is interesting to me, because I'm pretty sure the email stuff doesn't work and isn't configured correctly. This doesn't stop Mastodon from telling me that the email is in my inbox nonetheless:

![](/07-mastodon-self-serviceability/auth_setup.png)

I did some reconfiguration of the Mastodon server (changed the `SMTP_AUTH_METHOD` value in the SMTP configuration to `none` from `plain`) and tried to restart it, to no avail. There's a link on the post-signup page that says `Didn't receive confirmation instructions?`, but clicking it changes the page to a GIF of an elephant sitting in front of a broken display that seems to go away after a while..

When I look up the recommended way for troubleshooting errors, [the docs](https://docs.joinmastodon.org/admin/troubleshooting/) tells me to run `journalctl -u mastodon-web`, which on my end, yields:

```
root@mastodone:/home/mastodon/live# journalctl -u mastodon-web
No journal files were found.
-- No entries --
```

## Mastodon hosting

There are some Mastodon hosts out there who do the hard work for you, the docs point to [Hostdon](https://hostdon.jp/#/mastodon/about), [Masto.host](https://masto.host/), and [Spacebear](https://federation.spacebear.ee/software/mastodon). Spacebear charges a minimum of $17.27/month, Hostdon charges about $5/month, and Masto.host charges $7/month for the lowest tier of service. Does it count as self-hosted if I have to pay someone else to host it?


## The old fashioned way

There is [a section of the Mastodon documentation](https://docs.joinmastodon.org/admin/prerequisites/) which goes through setting up a server the manual way, but I simply don't have faith following the instructions will lead me around every pitfall.

## Rating Mastodon

- Code Availability

Mastodon's code is very available. There is an active community of devoted contributors, and I found plenty of prior art about many of the errors I encountered in their Github issues.

- Cost

I would say that Mastodon definitely can be run on a $5 droplet if it is only going to serve a single person. That said, it will use almost every ounce of resource that droplet has:

![](/07-mastodon-self-serviceability/mastodon_stats.png)

My intuition tells me that a single-user social media application should not consume resources like this, but the droplet is also running all the supplementary software. I could get more headroom by using a managed Postgres and Redis instance at DigitalOcean, but this would significantly increase the cost.

- Operability

I was never able to view logs about what was causing my SMTP errors, and I don't seem to have any easily-accessible resource for determining service health. If  redis, for instance, were to go down, I don't seem to have a way of knowing or checking.

- Dependency Flexibility

Mastodon requires the use of [Sidekiq](https://github.com/mperham/sidekiq), as well as [Postgres](https://www.postgresql.org/) and [Redis](https://redis.io/). There is no way to run Mastodon backed by a different database. The 1-Click install also includes Nginx and Let's Encrypt.