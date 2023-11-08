+++
title = "Preventing generated files from causing problems"
date = "2023-08-29T23:40:18-06:00"
author = "verygoodsoftwarenotvirus"
cover = ""
tags = []
keywords = []
description = ""
showFullContent = false
readingTime = true
+++

# The premise

Generating files is an inevitable consequence of writing most software, but in particular Go. For a very long time, the collective wisdom when asked about support for generics could be summarized as [“just generate files for the types you need](https://www.calhoun.io/using-code-generation-to-survive-without-generics-in-go/), that’s what generics support in the compiler would amount to,” and the ethos stuck with the community.

In my primary side project, for instance, I generate service configs from `Config` literals, so that I know they will properly unmarshal when the service tries to load them. I also use [wire](https://github.com/google/wire) for dependency injection, which as you may have guessed, generates a big function with a bunch of constructors invoked in the correct order. A not-unpopular choice of library for interacting with SQL databases is the beloved [sqlc](https://sqlc.dev/), which generates Go code from properly annotated SQL query files.

# The problem

The problem with generated files is that they can become out of data. Someone on the team changes a query in a PR, but doesn’t re-run the `sqlc` compiler to produce fresh output. Someone changes a config, which causes subsequent deployments to fail because the name of a JSON field no longer matches. Someone changes the order of parameters in a constructor, and all of its tests, but doesn’t re-run wire to ensure the build step fails. (The last one is actually fairly interceptable, assuming you’re doing the bare minimum of trying to build your binary in CI, but I’m not here to judge anybody’s shortcomings).

# THe solution

How do I prevent these inevitabilities from ruining any given evening? I require that when myself or a team member introduces a new class of generated files, we also introduce a CI step that runs the required generation command, and fails if git detects changes afterwards. Here’s my sqlc setup, for instance:

```yaml
on:
  pull_request:
    paths:
      - cmd/**
      - pkg/**
      - internal/**

concurrency:
  group: ${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: true

name: generated_files
jobs:
  queries:
    timeout-minutes: 10
    strategy:
      matrix:
        go-version: [ '1.21.x' ]
    runs-on: ubuntu-latest
    steps:
      - name: Install Go
        uses: actions/setup-go@v4
        with:
          go-version: ${{ matrix.go-version }}

      - name: Checkout code
        uses: actions/checkout@v3

      - name: Ensure configs can be generated
        run: make queries

      - name: Check for changes
        run: git diff --exit-code
```

This installs Go, checks out the code, runs the query generation command, and asks Git for any diffs and to fail if they’re present. Note that, in my case, I’m using [make](https://www.gnu.org/software/make/manual/make.html) and [Docker](https://www.docker.com/) to compile the sqlc queries with `docker run --rm --volume $(shell pwd):/src --workdir /src --user $(shell id -u):$(shell id -g) sqlc/sqlc:1.22.0 compile --no-database --no-remote`, but in the event I couldn’t or weren’t, you’d also then be able to document exactly what tools are necessary for generated which files, which helps newcomers to the repository.
