---
title: "Baby's First AWS Deployment"
date: 2022-01-29T23:34:37-06:00
draft: false
---

### Preface

I intend for this post to serve as [an experience report](https://github.com/golang/go/wiki/ExperienceReports) from a newbie AWS user. Hopefully you enjoy it and don't feel like you've wasted your time at the end.

I want to take the time to note that I have great respect for all the folks who make these companies work and who build these products. None of my opinions are directed at a human being who has a name and/or respirates. If I couldn't figure something out, I assume (and expect you to assume as well) that at the very least, I am more responsible for that shortcoming than the service providers or their documentation. In the extremely unlikely event anybody but me and my proofreader (hi [Caroline](https://www.cloughproofreading.co.uk/)!) ever even reads this, I hope that I will have provided enough information on whatever confusions I experienced that maybe something actionable can come of it.

### The App in Question

The app itself is pretty simple. It’s a meal plan manager, where you can organize and propose a meal plan for your household for the week. So, you can say, for example, "For dinner on Wednesday, we can do spaghetti and meatballs, or egg fried rice or baba ganoush," and then every member of your household can vote on which one they’d prefer to eat. An async worker tallies the rankings using the [Schulze method](https://en.wikipedia.org/wiki/Schulze_method) and finalizes the meal plan. Thus far, it has lived as a local-only project I work on in my spare time. I’ve sort of over-engineered it on purpose in the spirit of learning.

A worker process checks the database every minute for meal plan proposals that are still awaiting votes but have expired voting deadlines so it can tally up the winner and finalize the meal plan. This is done in an external worker so that I don’t bog down any of the HTTP traffic the server handles with unrelated compute burden.

Why a data changes queue? I don’t have any concrete product plans for this yet, as it were, but I think you could do something like email the meal plan creator if a vote is received and the meal plan is consequently finalized, for instance. You could produce audit logs for a more serious application. It's also where any customer data analytics collection should occur, so you don't inherit that latency during user requests.

This might seem like a lot, but it’s actually quite pared down from a previous iteration of the system where there were separate queues for writes, updates, deletes, the meal plan finalization worker (which I had set up as merely the sole component of a broader "chores" worker), and the data changes queue.

### Goals

I had a few things I really wanted to make sure I accomplished:

- I want to run it in AWS. To call it cargo culting is likely fair, but every single company I’ve ever worked for has used AWS. I’ve never been on the team that actually, y’know, _uses_ it, though. Plus, it’s bound to be a valuable skill for a software engineer to have.
- Since it’s going to be coming out of my own wallet, I want to – as best I can and where appropriate – avoid expensive pitfalls.
    - I follow Corey Quinn on Twitter (and, because of my recent foray into AWS, the Last Week in AWS newsletter he also organizes), so I know about the pitfalls of [Managed NAT Gateways](https://www.lastweekinaws.com/blog/the-aws-managed-nat-gateway-is-unpleasant-and-not-recommended/) and such. So I’d like to avoid that, if possible.
    - In the AWS Pricing Calculator, I ran what I thought I would need as a bare minimum, what I thought I’d really need, and what I would recommend if I was spending someone else’s money. The estimates came out to be something like $80, $120, and $210 each (they also ended up being meaningfully inaccurate). I resolved to be willing to tolerate up to $200/month on this service in the event unforeseen costs occurred for this first go-around.
- No Kubernetes, if possible.
    - Invariably someone is going to read this and say, "What about Kubernetes?". Kubernetes is a great solution for the right problems, but I don't think a simple CRUD site connecting to a database is a worthy candidate. Also, since I'm on AWS, their offering, EKS, costs $75 without any compute to even start using, which I think will put me over my acceptable budget threshold.
    - If I switch to Kubernetes, then I have to run it locally to build the configuration and to validate that it works the way it should. Last time I had to do this for work, it involved Vagrant and Minikube, and well...please don’t make me do this.
- I want in on the Serverless hype.
    - That is to say, ideally, I end up with absolutely no machines that I, or anybody else, could SSH into.
    - Ideally, I could define my infrastructure in terms of how little and how many resources it should receive, and have AWS do the plumbing to make it all function properly.
- I want it to scale.
    - If you’re groaning, well, same. "Scale" has many meanings, and I certainly can’t profess that I’ve built something that can handle most of those meanings.
    - Ultimately, what I would like is to be at least positioned such that my little service could use as few resources as possible when (in the most likely case) nobody is using it, but also be able to handle a sudden spike in popularity without completely dying.
    - As someone who has [had services eat shit before](/posts/the-story-of-porktrack/), that’s "scaling" to me.
- I want to maintain as close to 100% of this infrastructure in code form as possible.
    - To satisfy this, I chose Terraform. I’ve never gotten a chance to write Terraform professionally, but I have seen it used frequently at my workplaces over the last few years, so I feel confident in using it. I was afraid of screwing up state management, and was glad to discover that Hashicorp (who make Terraform) have an official offering in the form of Terraform Cloud that can manage the state for you.
    - I considered using Pulumi, which seems like a really cool project (shout out to all the folks building Pulumi!). That said, [their pricing model](https://www.pulumi.com/pricing/) for their cloud offering is based on hours in which they’re responsible for managing your infrastructure, measured in their own little credit currency, and I just didn’t like that. I don’t like the idea of wondering if I have enough funny money to get through the month, and I think it’s incorrect to suggest that Pulumi is "actively managing" anything when it isn’t running.
- As close to 100% of the infrastructure has to be able to be spun up from start to finish in as few steps as possible, and ideally, just one.
    - I want to be able to go from having some AWS credentials attached to an account with no resources to a fully functioning website, ideally with a single CI run.
    - I don’t actually know how much all of this is going to cost me. If I can spin it up and down on demand, then I can iterate on it when I have the time and save myself the money when I am just too swamped to touch it.
- I want to be able to view logs, traces, and metrics. The three pillars, as it were.
- Ideally, no vendor-specific code written.
    - Let me clarify: I don’t want to have to end up writing some glue code that is only relevant in AWS and is significant in scope. I make an exception for Lambdas themselves, since the actual wrapper stuff you’d have to implement is not significant. I could very easily take a Go Lambda and turn it into a [Cloud Function](https://cloud.google.com/functions). I’m talking about code that you simply couldn’t port over in any fashion to another environment. I don't want to write, for instance, [API Gateway Authorization Lambdas](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-use-lambda-authorizer.html).

### Translating to the Cloud

For AWS, I went with [ECS Fargate](https://aws.amazon.com/fargate/) for the main API server hosting. There are a few ways of hosting web servers in AWS, but Fargate seems to be the newest and most container-oriented. It seemed to be the closest thing to a "give me a container and some operational specifications, and I’ll take it from here" service, and the pricing didn’t seem too bad. When I did the calculation, the bare minimum you could spend (which was plenty for my little server) was just shy of $8/month.

For the data changes queue, I used SQS, and for the changes worker that listens on that queue, I went with Lambda. I’ve used Lambda before, though never triggered by an SQS queue. I decided to use Lambda for the meal plan finalization worker as well.

### Database

I opted for Aurora Serverless in my first go around, because I was really sold on the "this is THE serverless database option" hype. I imagined all these infinite scaling possibilities, and I assumed a low-tier RDS instance would get something paltry, like 10 or 15 connections per instance. "I’m gonna have so much traffic!" I told myself. "I’m gonna end up firing dozens if not hundreds of Lambdas at once and easily overwhelm whatever RDS instance I can afford!"

This was very wrong. According to the relevant AWS documentation page, I discovered that a db.t2.micro should have 1000000000 ÷ 9531392 = 104.9 connections, if I’m doing that math right (I may very well not be). I also learned that having lots of traffic doesn’t mean you will spin up lots of Lambdas, as they execute in batches, and you have to be very explicit to set it up to react in a one-to-one manner.

Aurora Serverless proved to be much too expensive, and came with some, in my opinion, major caveats. For one, they [only let you use version 10.14](https://web.archive.org/web/20220129203152/https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-serverless.relnotes.html) of Postgres, which [came out](https://www.postgresql.org/docs/release/12.4/) on [the same day](https://www.postgresql.org/docs/release/12.4/) as version 12.4.

Additionally, [the AWS calculator](https://calculator.aws/#/) lets you configure a *\*sigh*\* "Aurora Serverless PostgreSQL-Compatible Edition" (they must get paid by the syllable at AWS) with only one ACU (Aurora Capacity Unit – nine syllable bonus points for you), and it will tell you that one ACU is $43.80, at the time of this writing. You actually cannot configure a Serverless Postgres Aurora instance with less than two ACUs, which means the *least* you can spend is nearly $90, but there is no indication of this "gotcha" in the billing calculator. I ended up using a small RDS instance for the database.

### Diving In

I got started by creating a Terraform Cloud account. I played around with Terraform first by setting up a version controlled workspace and wrote some minor code to ensure all the organization’s repositories have access to the same base set of issue labels:

```
variable "issue_label_configs" {
  type = list(any)
  default = [
    {
      Name        = "blocked",
      Description = "blocked by other issues",
      Color       = "B60205",
    },
    {
      Name        = "nice-to-have"
      Description = "things we should maybe do. maybe not."
      Color       = "E5E4D3"
    },
    {
      Name        = "tech debt"
      Description = "paying back technical debt."
      Color       = "9AFE3B"
    },
    # etc...
  ]
}

variable "repositories" {
  type = list(string)
  default = [
    "api_server",
    "webapp",
    # etc...
  ]
}

locals {
  all_labels = setproduct(var.repositories, var.issue_label_configs)
}

resource "github_issue_label" "labels" {
  count = length(local.all_labels)

  repository  = local.all_labels[count.index][0]
  name        = local.all_labels[count.index][1].Name
  description = local.all_labels[count.index][1].Description
  color       = local.all_labels[count.index][1].Color
}
```

This allowed me to get a little comfortable with HCL and Terraform Cloud before writing anything that would spend money. Highly recommended.

I already had an AWS account, and I briefly tried to set up something that made sense for this little organization, but I wasn’t left, after about a day of searching, with a clear picture of how I should manage that. I could use [AWS Organizations](https://aws.amazon.com/organizations/) to link multiple companies and have one account per environment, but that seems like overkill and a lot to set up for a little app, so I just used the account I already had and created a key for Terraform and GitHub Actions. Terraform needs the key to create the infrastructure; GitHub Actions needs the key to push container images on merge.

While I used the VCS configuration for the global org Terraform workspace, I opted to use the remote configuration for the actual project repositories. This is because I want to be able to control when the actual Terraform apply happens, whereas if it’s VCS-backed, it fires off as soon as the commit happens.

### Configuration

I chose to use [AWS Systems Manager Parameter Store](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html) (more syllable bonus points for you!) to store things like the address of the SQS queues and database credentials. That way, I can have Terraform create those values and update them when appropriate, and my deployed software can have a stable place from which to fetch configuration values. This helps me keep deployment to one step, as opposed to a method where I'd have to first create the resources and *then* put their respective values into a config in a second step.

There are a LOT of ways to host configuration values in AWS. You could use Parameter Store (and, from within that, you can use a standard or *advanced* parameter, the only difference of which seems to be a larger payload limit), you could use [AWS AppConfig](https://docs.aws.amazon.com/appconfig/latest/userguide/what-is-appconfig.html) if you need really fancy features like schema validation, you could plop it into an S3 bucket, or you could probably use [Dynamo](https://aws.amazon.com/dynamodb/) if you really wanted. There are no consistent guidelines for which of these products is advisable for any given situation, and I ended up using Parameter Store because it's what we do at work.

### Observability

Figuring out an observability stack that worked ended up feeling impossible. Locally, I use [OpenTelemetry](https://opentelemetry.io/) reporting straight to a [Jaeger](https://www.jaegertracing.io/) instance for traces, a [Prometheus](https://prometheus.io/) instance for metrics, and a [Grafana](https://grafana.com/) instance to visualize all of it. I feel it's important to note [the Collector](https://opentelemetry.io/docs/collector/)'s absence here, as it is the main way OpenTelemetry advises getting data out to various providers, via a collector instance or sidecar. I have experience using the Collector, but the OpenTelemetry code I wrote for this repository comes from an era where the best way to get this done was to use [the Contrib libraries](https://github.com/open-telemetry/opentelemetry-go-contrib).

In AWS, I just used X-Ray for traces and CloudWatch for logs, but CloudWatch metrics are [pretty expensive](https://aws.amazon.com/cloudwatch/pricing/). At $0.30/metric (as of the time of this writing), the [standard suite of Go runtime metrics](https://pkg.go.dev/runtime/metrics#hdr-Supported_metrics) would cost $8.70/month. I just assume that blows up if I have multiple services.

AWS offers [a managed Grafana service](https://aws.amazon.com/grafana/) *and* [a managed Prometheus service](https://aws.amazon.com/prometheus/). However, only the Prometheus service is set up in the Terraform provider, which means I couldn’t provision them together. I had half a mind to add the provider myself, but even if we ignore that I know nothing about how either product works or how to stitch the two of them together, am I going to spend my precious free weekend time adding features to not one but TWO publicly traded companies’ products?

![](/04-babys-first-aws/images/no-i-dont-think-i-will.png)

I tried to implement [Grafana Cloud](https://grafana.com/products/cloud/), since they offer a pretty competent free tier, and I very much enjoy using Grafana in my local stack. They require you run their own [Grafana Agent](https://grafana.com/docs/grafana-cloud/agent/) sidecar, but I was never quite able to get it all working correctly. The team itself was very communicative and [invited me to troubleshoot with them on GitHub](https://github.com/grafana/agent/discussions/593). This was how I discovered a lot of my failings were user error. I still like Grafana Cloud quite a bit, and would like to get to use it in the future. The team inspired great confidence in their product for me.

I took a gander at [DataDog](https://www.datadoghq.com/), which I've also used at nearly every job I've ever had, but it is very difficult to determine how much it would cost me. I know it’s $15/host, but does the OpenTelemetry sidecar I’d have to run in ECS count as a host? Each container? Each service? Each Lambda invocation? The best I could gather was that it would cost me anything from $50 to $400 to use, and either side of that huge range still puts me outside my budget.

[Honeycomb](https://www.honeycomb.io/) is an attractive offering and was easy to get working. It wasn't until I learned that they only support logs and traces on the free plan, and metrics aren’t achievable without calling a sales rep, that I felt dismayed. Every indication I could find for how much this would cost me (to be fair, there were few) looked like it started at $1k.

There are a ton of [other](https://www.logicmonitor.com/cloud-monitoring) [providers](https://www.dynatrace.com/platform/infrastructure-monitoring/) in this space, but they all feel either dated compared to DataDog and Honeycomb or geared exclusively towards large Enterprise contracts. I don’t begrudge these companies for pricing the way they do, because they’re not thinking of folks like me when they make these decisions, and it probably makes sense for them not to. Doesn’t help me out all that much, though.

I ended up using X-Ray for tracing and CloudWatch for logging. I never managed to implement the Go runtime metrics I wanted because I couldn't manage to get the OpenTelemetry code working in AWS, despite a few days of my best efforts.

<blockquote class="twitter-tweet"><p lang="und" dir="ltr">😎 <a href="https://t.co/8cD6wT0S0x">pic.twitter.com/8cD6wT0S0x</a></p>&mdash; footloose and fancy-free (@vgsnv) <a href="https://twitter.com/vgsnv/status/1470958221850558467">December 15, 2021</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

### Elasticsearch Woes

Locally, the service used Elasticsearch to allow users to search through ingredient names and such. At first, I tried to use [Elastic.co's Cloud offering](https://www.elastic.co/cloud/), which is about $17/month. I found that the base Cloud offering seems to be geared towards folks using the ELK stack, but I didn't need the LK part of it. Also, VPC restrictions meant I couldn't get the Lambdas to write to it.

I tried to use [AWS' managed Elasticsearch offering](https://aws.amazon.com/opensearch-service/the-elk-stack/what-is-opensearch/), but it came with some serious restrictions. ["The t2.micro.search instance type supports only Elasticsearch 1.5 and 2.3."](https://docs.aws.amazon.com/opensearch-service/latest/developerguide/supported-instance-types.html) (a version that came out at the end of March 2016, almost six years ago). I also wasn't ever able to get the code I'd written (that worked with Elastic Cloud) to communicate with it, though in hindsight, it must have been some combination of IAM and VPC failures on my part. I spent the better part of a week trying to get this to work, and it was literally so frustrating that I rewrote the search code to just do ILIKE queries to the database and removed Elasticsearch from the project altogether.

<blockquote class="twitter-tweet"><p lang="en" dir="ltr">if you have the nerve, gall, the unmitigated audacity to try and run an Elasticsearch machine in AWS on something approachable like a <a href="https://t.co/8eNdwUy2NB">https://t.co/8eNdwUy2NB</a>, they punish you by making you use a version of Elasticsearch from nearly six years ago. This is customer obsession, folks.</p>&mdash; footloose and fancy-free (@vgsnv) <a href="https://twitter.com/vgsnv/status/1464610856046583815">November 27, 2021</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

### Aspiration Shopping

A phenomenon I noticed when I was looking through the (sincerely, epic) list of services that AWS offers is that it’s easy to start adding things to your mental cart that might be premature for your needs. Around the time I started planning all this stuff, AWS [announced Cloudwatch Evidently](https://aws.amazon.com/blogs/aws/cloudwatch-evidently/), and I got really into the idea that I would end up writing some Evidently tests after all was said and done. AppConfig was another thing like that, a moment where I said, "OoooOOOOOoooo, that *would* be fancy!". I don’t have any good advice for avoiding this phenomenon but feel nevertheless obligated to call attention to it.

### Ordering is Important

One of the first obstacles I encountered was maintaining my desired operational order. I wanted to not only be able to spin everything up from scratch, but also have all these Lambdas set up before pushing code. The deploy job has two phases that operate in tandem: "build", which compiles binaries for the Lambdas, and "scaffold", which effectively runs "Terraform apply".  After those, the "deploy" job runs, building and shipping containers and the artifacts from "build". I haven’t managed to find time to figure out how to build the containers and download them in later jobs.

The problem comes from Terraform requiring some artifact to set up a Lambda function. I could make the "scaffold" step have "build" as a prerequisite, and have "scaffold" download those artifacts, but I don’t like that. Instead, a neat trick I learned was that you can give the Lambda an empty zip folder by using the "hashicorp/archive" provider to create an empty zip folder:

```
data "archive_file" "dummy_zip" {
  type        = "zip"
  output_path = "${path.module}/data_changes_lambda.zip"

  source {
    content  = "hello"
    filename = "dummy.txt"
  }
}
```

Then, you can reference it in your Lambda definitions:

```
resource "aws_lambda_function" "example" {
  # required things here

  filename = data.archive_file.dummy_zip.output_path
}
```

This allowed my desired order to work correctly, with the caveat that if your Lambdas manage to get invoked before the "deploy" job can finish deploying the relevant Lambda artifacts, they will fail with a spectacular error.

You could probably also use containers, since the Lambda runtime supports those as well, but I haven’t tried it, so I don’t know what happens when you set it to use a Lambda that has no images pushed to it yet.

### VPC Headaches

Whenever I’d worked in AWS before, I invariably ran into IAM issues, which led me to believe that IAM would be the thing I fought with most in this effort, but far and away, it was VPC. There are basically no good tutorials for how to provision this correctly; you kind of just have to copy the same IP ranges everybody else has copy/pasted and hope you get there. I had at least two moments where something I was pretty sure I’d already tried a few times that didn’t work (but just wanted to check one last time) worked all of a sudden, and I was too frustrated and tired to even be happy about it.

Troubleshooting [security groups](https://docs.aws.amazon.com/vpc/latest/userguide/VPC_SecurityGroups.html) proved to be quite difficult. There’s no "hey, can an ECS cluster with security group X talk to database Y?" button, but oh boy, did I need one. There is the [AWS VPC Reachability Analyzer](https://docs.aws.amazon.com/vpc/latest/reachability/what-is-reachability-analyzer.html) (fat syllable bonuses all around), but it is not useful for analyzing security groups, as far as I can tell.

Speaking of security groups, I was particularly confused by what counts as ingress. If I have a service that makes an outbound request on port 443, do I also have to allow inbound traffic on 443 for the response? Maybe revealing I had this question makes me look stupid or something, but when all you have to go on is that your service can’t make HTTP requests (because the security group is misconfigured), it’s very hard to rule that out without trying it.

### Avoiding Managed NAT Gateways

This proved to be more difficult than I thought it would be. For instance, I found [this very, very good tutorial](https://section411.com/2019/07/hello-world/) on how to not only use ECS and Terraform, but also specifically for a Go project like mine, which I followed as close to the letter as I could. Everything worked after applying it, too, only I noticed too late that `resource "aws_nat_gateway" "ngw"` was the notorious, wretched beast I’d feared all along. I was able to find a way to remove it, but it became clear that this is a pattern. Other tutorials I looked at for how to troubleshoot problems asked to use a Managed NAT Gateway as well, because it's an easy answer to these problems, and most AWS users don't seem to have to pay the bill.

When I tried to get my workers, uhh...working, they were failing to access SSM Parameter Store because I had put them in a private subnet so they could access the database, which was also in the private subnet. It turns out doing this means they don’t have access to the public internet, and consequently, to access any of a number of AWS services, you have to spin up [VPC Endpoints](https://docs.aws.amazon.com/vpc/latest/privatelink/vpc-endpoints.html). They are priced in a way that is very much similar to Managed NAT Gateways, and they serve the same functional purpose, only they're restricted to a singular service, which I took to mean they're the same service with a different name and maybe simpler configuration.

Later, when I tried to move the meal plan finalizer worker into ECS to try and save on these costs (thinking it would be easier for them to access SSM from ECS than from Lambda), I found I had the exact same problem: the worker couldn’t connect to any AWS services unless it was running in the same task that ran the server (because that server container has an Internet Gateway to receive traffic).

### ECS/ALB Headaches

It took me a few days to get my IAM set up so that the ECS service could actually, you know, talk to SSM or RDS or anything. Once I had gotten that up and I could see that my logs were getting to the "server's up, serving traffic" phase, they were still being systematically killed every 30 seconds or so. They were in this state for a couple of days before I eventually realized that when you set up an ALB to talk to a web service hosted in ECS, it comes with a health check, and this defaults to "/". This server doesn't serve anything at the root, so it was failing the health check even though it was healthy. That was pretty confusing, but also pretty easy to fix. Soon enough, the server was up and enjoying life without premature destruction.

### SQS Headaches

For about a day, I had a Lambda deployed to AWS that, because of a minor bug, couldn't successfully execute. By default, a successful Lambda execution is required to acknowledge a message and get it off of the queue. So, if you don't configure [a dead letter queue](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-dead-letter-queues.html) (I hadn't), and your code will never succeed (aforementioned), then the message will just get re-placed on the queue, and you've got yourself an infinite loop that eats through your budgets:

<blockquote class="twitter-tweet"><p lang="en" dir="ltr">i want to know how <a href="https://t.co/K7yxo9WN8F">pic.twitter.com/K7yxo9WN8F</a></p>&mdash; footloose and fancy-free (@vgsnv) <a href="https://twitter.com/vgsnv/status/1473533020900663306">December 22, 2021</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
<sub>(I figured out how)</sub>

### Outcome

I was able to get the service spun up in AWS as I had designed it and able to confirm it worked as I suspected. I also set up a service prober Lambda that would run every five minutes, create a household with four members, propose a meal plan, have some users vote for some options, wait for the meal plan to get finalized, and then validate the outcome. This prober ran successfully for a month or so, and the service handled everything like a champ.

That said, it was VERY expensive. When I was building this in December, I would start my evening at about 7:30PM by deploying and having Terraform spin everything up, and then I would have Terraform Cloud destroy whatever inventory was present by 1:30AM. Nonetheless, my bill for December was $130-ish. I realized the Aurora problem, switched to RDS, and got rid of a lot of the Lambdas to simplify the application and consequent bill. I let the new iteration run for almost a month and was headed towards another $120 bill, which I think means the old system would have cost something like $190/month if I hadn’t swapped databases.

<blockquote class="twitter-tweet"><p lang="en" dir="ltr">so this seems bad <a href="https://t.co/3eu3kM2Nna">pic.twitter.com/3eu3kM2Nna</a></p>&mdash; footloose and fancy-free (@vgsnv) <a href="https://twitter.com/vgsnv/status/1479299794992570375">January 7, 2022</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

January's bill was about $130. I started to move the worker into ECS then, to save costs, but ultimately felt burned by the whole thing. The networking charges aren't even really that much money in the grand scheme of it all, but the principle of having to pay AWS to connect infrastructure it runs to infrastructure it runs just didn't sit right with me. I spun down all my infrastructure, and will be taking my code and service elsewhere.

### What’s Next?

I don’t want to keep building on AWS, because it feels like going to a sleepover at the house of a girl who has told everyone she hates you. I don’t know where I’ll go next with all of this. Azure doesn’t feel ready yet. DigitalOcean has an app platform now that I might try out. GCP was okay, but has positioned itself of late as the enterprise-y provider of choice. Oh no, am I going to have to use Kubernetes?! I'll figure it out and make another post.

### Conclusions

AWS is a really solid platform that will reliably serve your applications. Once you get through the IAM/VPC hurdles, everything works well and feels sturdy. There are lots of solutions to the various problems one can encounter when building services or tackling new problems. The quality of service you get is truly great, but it is not offered with any benevolence or charity. You will get very high quality service, and you absolutely will pay a pretty penny for it. It's [not without its quirks](https://twitter.com/vgsnv/status/1465029923006029840), but obviously serviceable.

The biggest lesson I’ve taken away from this endeavor is that AWS assumes you have access to some VC-backed bank account, and thus litter their documentation with traps where you have no choice but to give them more money. The broader community aids them in this goal by never mentioning the specter of cost in tutorial blogs. It’s not enough that you’d write your congressional representative about; nobody writes their rep about a $35 business expense. It is more than enough, however, to make me feel like I’m not working with a partner, I’m inflicting myself with a parasite.

I'm really happy with both GitHub Actions and Terraform. There were a few times where Terraform screwed up and left me in a state where I had to manually intervene, but considering the nature of what it does and how well it normally does it, I'm more than willing to tolerate that. Cloudflare was awesome, too, and I've long been a fan of the service they operate.
