---
draft: true
title: "Using Docker to compile Golang plugins on OS X"
date: 2018-01-11T20:23:35-06:00
---

Okay so this might be old news to some of ya'll, but I just got it figured out, and any time you figure something out that didn't have an immediate answer online, you should blog about it, right?

# The Problem

I've been building a side project for a while that has an API server component. It's built with Postgres in mind, but being that it's something meant to be self-hosted in the future, I wanted to provide any potential users with the option of using whatever database they chose.

The server in question is written in Go, and the main problem I was worried about facing was related to imports. Sure, I could write a `postgres` package, and a `mysql` package, and I could even import them both in my `main.go` file and instantiate the appropriate struct based on a user config, but where does that madness stop? Could my precious `main.go` one day look like this?

```go
package main

import(
    "database/sql"

    "github.com/org/project/api/storage/db/postgres"
    "github.com/org/project/api/storage/db/mysql"
    "github.com/org/project/api/storage/db/mongodb"
    "github.com/org/project/api/storage/db/sqlite"
    "github.com/org/project/api/storage/db/cockroachdb"
    "github.com/org/project/api/storage/db/esotericdatabaseyouveneverheardof"
    "github.com/org/project/api/storage/db/plainoldtextfileslol"

    _ "github.com/lib/pq"
    _ "github.com/lib/repeat"
    _ "github.com/lib/ad"
    _ "github.com/lib/infinitum"
)
```

That obviously won't do. I remember reading about [Go's plugins when they came out](https://golang.org/doc/go1.8#plugin) a while back and decided that might be an interesting way to tackle this problem. I could break my `postgres` package out into its own repo, import it as the default option, and accept plugins that were built by developers for their favorite databases, so long as they satisfied the interface I had defined for what constituted a database storer.

So I built a tiny demo app that executed a very simple query, and used some code from the existing repo to create a tiny package that I could then compile into a plugin to test my theory. I ran `go build -buildmode=plugin`, and received this output:

```bash
-buildmode=plugin not supported on darwin/amd64
```

Rats! In all my excitement and fervor, I never thought to check if plugins were even supported on my platform. It even says on the release notes that I linked above! `Plugin support is currently only available on Linux.` It was a nice reminder that because I sort of naturally gravitated towards being a Go developer on OS X, I'm much more frequently in a position to beta test new things than be shut out of them.

But what to do about my problem?

# Docker to the rescue

I wasn't worried about the API being able to use the generated files, because they run entirely in Docker containers anyway. I run debug builds locally and integration tests everywhere using Docker compose. So I wondered if I could set up a Dockerfile that would add my package, build the .so file I needed, and spit it back out to my host machine so I could hand it over to my other package and get all the things I wanted out of plugins without having to futz with partitioning drives or picking a distro out and otherwise completely reconfiguring how I do my work.

Here's what I came up with:

```docker
FROM golang:latest
WORKDIR /go/src/github.com/verygoodsoftwarenotvirus/plugintest

ADD . .

CMD go build -buildmode=plugin -o /output/result.so
```

and the corresponding bash script:

```bash
mkdir -p output
docker build -t plugins .
docker run --volume=$(pwd)/output:/output --rm -t plugins
```

Run your bash script, and you'll have `output/$PKG_NAME.so` in your folder in relatively no time.

Hopefully this helps somebody else who faced the same predicament I did. :)