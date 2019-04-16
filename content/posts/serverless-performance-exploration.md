---
title: 'Using Docker to compile Golang plugins on OS X'
date: 2019-04-16T02:23:35-06:00
draft: true
---

I have a simple question that I need to know the answer to in order to go to sleep tonight: which is faster, a cloud function that responds to a pubsub topic, or an always-running service subscribed to that pubsub topic?

At first glance, before writing any code or doing anything, I could bet either way and feel just as confident as if I'd done the opposite. I don't know precisely how the backend behind pubsub topic publish -> cloud function actually firing works, but it wouldn't surprise me to find out that Google has a convenient mechanism that pre-loads the cloud function so there's no cold start gap, among other tricks.

I spun up a new project in GCP, and wrote up a quick cloud function:

```go
// RespondCloudFunction consumes a Pub/Sub message and is executed as a cloud function
func RespondCloudFunction(ctx context.Context, m pubsub.Message) error {
    db, err := cloudfirestore.ProvideStorageInGCP(projectID)
    if err != nil {
        log.Fatalln(err)
    }


    _, _, err = db.Client.
        Collection(resultsCollectionName).
        Add(context.Background(), map[string]interface{}{
            "publish_time": m.PublishTime,
            "source":       "cloud_function",
            "saved_at":     time.Now(),
            "elapsed":      time.Since(m.PublishTime).String(),
        })


    return err
}

```

and then had a good long think about how I could actually control this, so here's what I've recentered on:

```txt
+------------+       +----------+
|   Cloud    |------->  Cloud   <----------------+
|  Function  |   2   | Pub/Sub  |                |
+-----+------+       +----^-----+                |2
      |                   |                      |
      |                   |                      |
      |                  1|                      |
      |                   |                      |
      |3                  |                      |
      |             +-----+------+        +------+-----+
      +------------>+  Machine1  |        |  Machine2  |
                    +-+-------^--+        +-------+----+
                      |       |                   |
                      |       |       3           |
                     4|       +-------------------+
                      v
                +-----+-----+
                |   Cloud   |
                | Firestore |
                +-----------+
```

the code for this is available [here](https://gitlab.com/verygoodsoftwarenotvirus/prototypes/tree/26cb2028f8174ee89229523d5d94542c2f94cb03/serverless)

machine 1 runs the server in `cmd/prober`, which puts a message with a unique ID onto the pubsub topic every 5 seconds, saves that in an in-memory database, and exposes two routes, `/cloud_function/{probe_id}` and `/regular_service/{probe_id}`.

When the cloud function triggers, it immediately posts to the `/cloud_function` route and then exits. The "regular^[1]" service polls the pubsub constantly and, when it discovers an event, posts to the `/regular_service` route.

The server notes the timestamp, and most importantly, the time duration spent waiting for the services to respond, and when it detects that both timestamps are complete, it writes thgat value to cloud firestore.

It's not a perfect experiment, but we need some way to judge speed, and a central computer that is the sender and receiver of messages is the only way I know to reliably compare the times you see reported.

It took some finagling to get everything working, and I fell into the pitfalls that invariably occur for me when setting up new infrastructure: I screw things up because I'm really rusty. One such screwup was committing my service account key (I felt compelled to delete the whole project and start over!). Another time, something I did to try and avoid the prior service account calamity caused the service account that had access to cloud functions to be deleted in a way that I could not recover from (the documentation suggests disabling and re-enabling the cloud functions API, but I found that to have no effect.)

Pain aside, there's something magical about getting something working that just never gets old. It took until about 1 in the morning, but I finally got all of this configured, set up, authenticated, working, and not exposed via public git. I had all this data, and this wonderful console to view it in:

![cloud filestore's UI leaves a little to be desired](/serverless-performance/cloud-filestore.png)

Just kidding, I kinda hate this! I want a fancy graph, people love graphs.

[1]: I hate this name, but I have no better ideas. Hardest problem in computer science, and all that.
