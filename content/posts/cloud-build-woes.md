+++
title = "Cloud Build Woes"
date = "2023-06-13T12:45:12-05:00"
author = "verygoodsoftwarenotvirus"
cover = ""
tags = []
keywords = []
description = ""
showFullContent = false
readingTime = true
+++

### The Background

I’m working on a service for organizing your household’s eating schedule, meal prep, grocery shopping, etc. Like most services, there are tasks we have to execute separately from the main business of serving API traffic. To accomplish these tasks in production, I’ve made use of [Google Cloud Functions](https://cloud.google.com/functions). There are essentially two flavors of Cloud Function I’ve made use of:

1. Those that take inputs (i.e. when you do something that requires being notified via email, we put details of that event onto a queue watched by a Cloud Function that eventually emails you).
2. Those that did not meaningfully accept inputs, but were rather executed by writing an empty JSON object onto a [Pub/Sub](https://cloud.google.com/pubsub) at a given interval using [Cloud Scheduler](https://cloud.google.com/scheduler).

### The Update

Recently, I endeavored to update the backend dependencies by running the trusty `go get -u ./...`. There were some minor backwards incompatibilities I had to navigate, but once my integration tests passed, I considered the matter settled and merged the code. The first deploy failed and was reporting itself as expired.

Not consistently the same function either. I re-tried the deploy about a half dozen times thinking maybe the service was just being slow, or I was just unlucky, and every time a different set of functions would have their builds expire. Something was up.

### The Something

The way Cloud Functions are configured is quite old school: you put your raw code files in a storage bucket, and tell the function definition that you keep the code there, what runtime and function they should call and so forth. In Go, you don’t even ship code capable of producing a binary (i.e. no `main()`, you ship a package with an exported function and tell the runtime that function’s name.

When your function is being built, [Cloud Build](https://cloud.google.com/build) grabs your code from the storage bucket and builds a special container with it. The default configuration for any given Cloud Function is to be built in the default Cloud Build worker pool. This is managed by Google, and so they set the rules, which say that you can have about. You can specify [a private build pool](https://cloud.google.com/build/docs/private-pools/private-pools-overview) (which is required for things like private NPM packages), and they charge you per-build minute.

So why did my builds fail? My best guess is that the update pushed my build times ****just**** over the limit, such that at least one of them is now bound to time out. There are some articles GCP provides about how to build slimmer containers with Cloud Build, but I don’t even define this container, and I’m already providing it with the least amount of code I can manage.

### The Solution

I went down the path of setting up the private worker pool and the cheapest machine did not build my functions adequately (it left like 5 expired). I was going to have to bump the machine up significantly, which was easy enough, but some back-of-the-envelope math suggested running the pool would cost me anywhere from 33%-100% of what the deployment currently costs to operate.

I make use of Cloud Run for a number of servers associated with the service, and I knew they had a [Jobs](https://cloud.google.com/run/docs/create-jobs) feature that was in preview. Coincidentally, it seems that it’s publicly available now, so I migrated every cloud function that was ignoring empty input on a Pub/Sub to be a Cloud Run Job instead.

The reason this ended up saving my bacon was that Cloud Run Jobs are just containers executed on a schedule. I can build them in GitHub Actions, and I don’t have to wait for Cloud Build, so by converting 4 functions to jobs, I’ve given myself that much more Cloud Build bandwidth.

### The Absurdity

This all feels so arbitrary to me. The cloud functions show up in the Cloud Run interface, only their containers can’t be specified unless they’re jobs or services. I should be able to ship a plain container to Artifact Registry and tell Cloud Functions to use it. I’m sure there’s some entrenched security or networking decision at the root of Cloud Functions insistence on how the container is built, but I don’t care about those things, I’m the user. I just want to ship code that will run reliably.

I wish I could have my deployment consist of Terraform making sure Cloud Functions reference the right containers, and then building and pushing those containers. I could probably achieve that with Kubernetes, but I’m really trying to avoid Kubernetes for as long as possible.

What’s more, the manner in which you invoke a Cloud Run Job on a function is no less silly than the empty JSON on a Pub/Sub approach. You effectively POST an empty JSON body to an authenticated route instead. I wish I could just associate a cron expression with a Cloud Run Job. That doesn’t seem like the craziest idea.