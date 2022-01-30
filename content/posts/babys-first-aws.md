---
title: "Baby's First AWS Deployment"
date: 2022-01-29T23:34:37-06:00
draft: true
---


### About this post

I intend for this post to serve a few purposes:

1. As an experience report from a newbie AWS user with to the relevant providers discussed here.
1. As a minor tutorial in the pitfalls I experienced deploying this kind of service to AWS.
1. Hopefully it makes you laugh at some point.

I want to take the time to note that I have great respect for all the folks who make these companies work and who build these products. In the extremely unlikely event anybody but me and the proofreader ever even reads this, I hope that I will have provided enough information on whatever confusions I experienced that maybe something actionable can come of it.

### The App in Question

The app itself is pretty simple. It’s a meal plan manager, where you can organize and propose a meal plan for your household for the week. So you can say, for example, “for dinner on Wednesday, we can do spaghetti and meatballs or egg fried rice”, and then every member in your household can vote on which one they’d prefer to eat. A third-party worker tallies the rankings using the [Schulze method](https://en.wikipedia.org/wiki/Schulze_method). Thus far, it has lived as a local-only project I work on in my spare time. I’ve sort of over-engineered it on purpose in the spirit of learning.

To explain the basic flow of data in the application, if I were to create, say, a recipe, the flow would go something like:

- log into the service, obtain a cookie
- hit the recipe creation route with the appropriate payload, which causes the server to:
    - identify the user from the cookie and attach subsequent info to the request context
    - the recipe service validates my payload and writes it to the database
    - a data_changes channel is written to
    - service responds with the full recipe content

An external worker runs every minute to check the database for meal plan proposals that are still awaiting votes, but past their voting deadline, so it can tally up the winner and let everybody in the household know what to look forward to in the week. This is done in an external worker so that I don’t bog down any of the HTTP traffic the server handles with unrelated compute burden.

Why a data changes queue? I don’t have any concrete product plans for this yet, as it were, but I think you could do something like email the meal plan proposer if a vote is received and the meal plan is consequently finalized, for instance. It’s also where any customer data analytics collection should occur, lest a provider outage wreak havoc on your service latency.

This might seem like quite a bit, but it’s actually quite pared down from a previous iteration of the system where there were separate queues for writes, updates, deletes, the meal plan finalization worker (which I had set up as merely the sole component of a broader `chores` worker), and the data changes queue.

### Goals

I had a few things I really wanted to make sure I accomplished when trying to actually deploy this system to a proper Cloud provider:

1. I want to run it in AWS. To call it cargo culting is likely fair, but every single company I’ve ever worked for has used it. I’ve never been on the team that actually, y’know, *uses* it, though. Plus, it’s bound to be a valuable skill for a software engineer to have.
2. Since it’s going to be coming out of my own wallet, I want to, as best I can and where appropriate, avoid expensive pitfalls.
    1. I’m follow Corey Quinn on Twitter (and because of my recent foray into AWS, the Last Week in AWS newsletter he also organizes), so I know about the pitfalls of [Managed NAT Gateways](https://www.lastweekinaws.com/blog/the-aws-managed-nat-gateway-is-unpleasant-and-not-recommended/) and such. So I’d like to avoid that, if possible.
    2. I ran what I thought I would need bare minimum, what I thought I’d really need, and what I would recommend if I was spending someone else’s money in the AWS Pricing Calculator. The estimates came out to be something like $80, $120, and $210 each. I decided to be comfortable with spending up to $200/month on this service in the event unforeseen overage charges occurred.
3. I want in on the Serverless hype
    1. That is to say, ideally I end up with absolutely no machines that I, or anybody else, could SSH into.
    2. Ideally I could define my infrastructure in terms of how little and how many resources it should receive, and have AWS do the requisite math to make it all function properly.
4. I want it to be capable of autoscaling
    1. If you’re groaning, I get it. “Scale” has many meanings, and I certainly can’t prove that I’ve accomplished something that would truly “scale” by any professional definition of the term while adhering to my budget. Ultimately what I would like is to be at least positioned such that my little service could use as little resources as possible when (in the most likely case) nobody is using it, but also handle a sudden spike in popularity without completely dying. That’s “scaling” to me, baby!
5. As close to all infrastructure has to be able to be spun up, from start-to-finish, in as few steps as possible, ideally one. As in, I should be able to go from having some provider accounts with zero usage, to a fully functioning website, ideally with a single CI run.
    1. I don’t know how much all of this is going to cost me. If I can spin it up and down on demand, then I can iterate on it when I have the time and save myself the money when I am just too swamped to touch it.
6. I want to maintain as close to 100% of this infrastructure in code form as possible.
    1. To satisfy this, I chose Terraform. I’ve never gotten a chance to write Terraform professionally, but I have seen it used frequently at my workplaces over the last few years, so I felt confident it was a good tool. I was afraid of screwing up state management, and was glad to see that Hashicorp (who make Terraform) have an official offering in the form of Terraform Cloud that will manage the state for you.
    2. I thought about using Pulumi, and it seems like a really cool project (shout out to whoever builds Pulumi!). That said, [their pricing model](https://www.pulumi.com/pricing/) for their cloud offering is based on hours in which they’re responsible for managing your infrastructure, and I just didn’t like that. I don’t like having to wonder if I have enough credits to get through the month, and I think it’s disingenuous to suggest that Pulumi is actively “managing” anything when it isn’t running.
7. I want the three pillars of observability to be at my disposal.
    1. I want to be able to view logs, traces, and metrics.
8. Ideally, no vendor-specific software
    1. Let me clarify: I don’t want to have to end up writing some glue code that is only relevant in AWS and is significant in scope. i.e. if I have to write some form of Lambda that only exists to aid in AWS-specific networking or something, that is a loss in my opinion. I make an exception for Lambdas themselves, since the actual wrapper stuff you’d have to implement is not significant. I could very easily take a Go Lambda and turn it into a [Cloud Function](https://cloud.google.com/functions). I’m talking about code that you simply couldn’t port over in any fashion to another environment.
9. No Kubernetes
    1. Invariably someone is going to read this and say “what about k8s?”. Kubernetes is a great little project for those who know it, but since I want to use AWS, a EKS cluster is like $75/month with nothing running on it, so too rich for my blood. (There are providers that don’t charge for the node manager, but GCP used to be one of them, which tells me which direction the others feel free to travel).
    2. If I switch to Kubernetes, then I have to run it locally to build the configuration and to validate that it works the way it should. Please don’t make me use Kubernetes for local development.

### Translating to the Cloud

For AWS, I went with ECS Fargate for the main API server hosting. It seemed to be the closest thing to a “give me a container and some operational specifications, and I’ll take it from here” service, and the pricing didn’t seem too bad. When I did the calculation, the bare minimum you could spend (which was plenty for my little server) was just shy of $8USD/month.

For the data changes queue, I used SQS, and for the changes worker that listens on that queue, I went with Lambda. I’ve used Lambda before, but never triggered by an SQS queue. I decided to use Lambda for the meal plan finalization thing as well.

### Database

I opted for Aurora Serverless in my first go around, because I was really into the hype, and I imagined these infinite scaling possibilities, and I assumed a low-tier RDS instance would get something like 1 or 2 connections per instance. “I’m gonna have so much traffic!” I told myself. “I’m gonna end up firing dozens if not hundreds of Lambdas at once and easily overwhelm whatever RDS instance I can afford! Wrong. According to the relevant AWS documentation page, I discovered that a db.t2.micro should have `1000000000 ÷ 9531392 = 104.9` connections, if I’m doing that math right (I may very well not be). Additionally, having lots of traffic doesn’t mean you will spin up lots of Lambdas, and you have to be very explicit to set it up to react that way. The branding containing the `Serverless` modifier also made me feel like this was what I was supposed to be using.

Aurora Serverless proved to be much too expensive, and came with some, in my opinion, unjustified/unjustifiable restrictions. For one, they [only let you use version 10.14](https://web.archive.org/web/20220129203152/https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-serverless.relnotes.html), which [came out](https://www.postgresql.org/docs/release/12.4/) on [the same day](https://www.postgresql.org/docs/release/12.4/) as version 12.4. Additionally, [the AWS calculator](https://calculator.aws/#/) lets you configure a **sigh** “Aurora Serverless PostgreSQL-Compatible Edition” (they really love syllables at AWS) with only 1 ACU (Aurora Capacity Unit), and it will tell you that 1 ACU is $43.80 USD at the time of this writing. You cannot configure a Serverless Postgres Aurora instance with less than 2 ACUs, which means the *least* you can spend is nearly $90. I ended up using a small RDS instance for the database.

### Configuration

My plan is to use AWS Systems Manager Parameter Store (what a mouthful!) to store things like the ARN of the SQS queues and master database credentials. That way I can have Terraform create those values and update them when appropriate, and my deployed software can have a stable place from which to fetch configuration values.

There are a LOT of ways to host configuration values in AWS. You can use the [AWS Systems Manager Parameter Store](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html) (and from within that, you can use a standard or *advanced* parameter), you could use [AWS AppConfig](https://docs.aws.amazon.com/appconfig/latest/userguide/what-is-appconfig.html) if you need really fancy features like schema validation, you could plop it into an S3 bucket, you could probably use Dynamo if you really wanted. The only one of these that feels advised is AppConfig, but it felt very overpowered for how I intended to use it.

### Observability

Locally I use OpenTelemetry reporting straight to a Jaeger instance for traces, a Prometheus instance for metrics, and a Grafana instance to visualize it. Figuring out an observability stack felt impossible with my restrictions. I started by just trying to use X-Ray and CloudWatch, but CloudWatch metrics are pretty expensive, considering I had implemented many of them freely locally.

AWS offers a managed Grafana service *and* a managed Prometheus service. However, only the Prometheus service is set up in the Terraform provider, which means I couldn’t provision them together. I had half a mind to add the provider myself, but ignoring that I know nothing about the product, how it works, or how to stitch it together: am I going to spend my precious free weekend time adding features to not one but TWO publicly traded company’s products?

![](/04-babys-first-aws/images/no-i-dont-think-i-will.png)

I tried taking a gander at DataDog, but it is very difficult to ascertain how much that would cost me. I know it’s $15/host, but does the OpenTelemetry sidecar I’d have to run in ECS count as a host? Each container? Each service? Each Lambda invocation? the best I could gather was that it would cost me anything from $50-$400 to use, and that’s outside my threshold.

Honeycomb looks attractive, until you learn that they only support Logs and Traces on the free plan, and metrics aren’t achievable without calling a sales rep.

There are a ton of other providers in this space, but they all feel aged, legacy compared to DataDog and Honeycomb. I don’t begrudge these companies for pricing the way they do, because they’re not thinking of folks like me when they make these decisions, and it probably makes sense for them not to. Doesn’t help me out all that much, though.

### Aspiration shopping

Something I noticed when I was looking through the (seriously, absolutely epic) list of services that AWS offers, it’s easy to end up adding things to your mental cart that might be premature for you. Around the time I started planning all this stuff, AWS announced Cloudwatch Evidently, and I got really into the idea that I would end up writing some Evidently tests after all was said and done. AppConfig was another thing like that, a moment where I said “ooooOOOOOoooo, that *would* be fancy!” I don’t have any good advice for avoiding this phenomenon.Initially I went with Aurora Serverless (the “PostgreSQL-compatible” one) for the database, but it

### Diving in:

I started by creating a Terraform Cloud account. I played around with Terraform first by setting up a Version Controlled workspace and wrote some minor code to ensure all the organization’s repositories have access to the same base set of Issue Labels:

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

I already had an AWS account, and I briefly tried to set up something that made sense for this little organization, but wasn’t left, after about a day of searching, with a clear picture of how I should manage that. I could use AWS Organizations to link multiple companies, and have one account per environment, but that seems like overkill, and a lot to set up for a little app, so I just used the account I had.

While I used the VCS configuration for the global org Terraform workspace, I opted to use the remote configuration for the actual project repositories. This is because I want to be able to control when the actual terraform apply happens, whereas if it’s VCS-backed it fires off as soon as the commit happens.

### Ordering is Important

One of the first obstacles I encountered was maintaining my desired operational order. I wanted to not only be able to spin everything up from scratch, and also have all these Lambdas set up before pushing code. The deploy job has two phases that operate in tandem: `build`, which compiles binaries, and `scaffold`, which effectively runs `terraform apply`.  After those, the `deploy` job runs, building and shipping containers and the artifacts from `build` (I haven’t managed to find time to figure out how to build the containers and download them in later jobs).

The problem comes from Terraform requiring some artifact to set up a Lambda function. I could make the `scaffold` step have `build` as a prerequisite, and have `scaffold` download those artifacts, but I don’t like that. Instead, a neat trick I learned was that you can give the lambda an empty zip folder by using the `hashicorp/archive` provider to create an empty zip folder:

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

This allowed my desired order to work correctly, with the caveat that if your lambdas manage to get invoked before the `deploy` job can finish deploying the relevant lambda artifacts.

You could probably also use containers, since the Lambda runtime supports those as well, but I haven’t tried it, so I don’t know what happens when you set it to use a lambda that has no images pushed to it yet.

### VPC Headaches

Whenever I’d worked in AWS before, I invariably ran in to IAM issues, which lead me to believe that IAM would be the thing I fought with most in this effort, but far and away, it was VPC. There are basically no good tutorials for how to provision this correctly, you kind of just have to copy the same IP ranges everybody else has copy/pasted and hope you get there. I had at least two moments where something I was pretty sure I’d already tried a few times and didn’t work, but just wanted to check one last time worked all of a sudden, and I was too frustrated and tired to even be happy about it.

Troubleshooting security groups proved to be quite difficult. There’s no “hey, can an ECS cluster with security group x talk to database y?” button, but dear lord did I need one. They do have a VPC Reachability Analyzer, but it is not useful for analyzing the reachability of, say, an RDS instance.

Speaking of security groups, I was particularly confused by what counts as ingress. If I have a service that makes an outbound request on port 443, do I also have to allow inbound traffic on 443 for the response? Maybe revealing I had this question makes me look stupid or something, but when all you have to go on is that your service can’t make HTTP requests (because the security group is misconfigured), it’s very hard to rule that out without trying it.

### Avoiding Managed NAT Gateways

This proved to be more difficult than I thought it would be. For instance, I found [this very very good tutorial](https://section411.com/2019/07/hello-world/) on how to not only use ECS and Terraform, but specifically for a Go project like mine, which I followed to the letter. Everything worked after applying it, too, only I noticed too late that `resource "aws_nat_gateway" "ngw"` was the notorious, wretched beast I’d feared all along. I was able to find a way to extract that, but it became clear this is a pattern.

When I tried to get my workers, uhh...working, they were failing to access SSM, because I had put them in a private subnet (so they could access the database). It turns out doing this means they don’t have access to the public internet, and so to access any of a number of AWS services, you have to spin up VPC Endpoints. They are priced in a way that is very much similar to Managed NAT Gateways, and they serve the same functional purpose.

Later, when I tried to move the meal plan finalizer worker into ECS to try and save on these costs, I found I had the exact same problem: the Lambda couldn’t connect to any AWS services unless it was running in the same task that ran the server (because that server container is connected via an Internet Gateway to receive traffic).

### Outcome

I was able to get the service spun up in AWS as I had designed it, and able to confirm it worked as I suspected. I also set up a service prober Lambda that would run every five minutes, create a household with four members, propose a meal plan, wait for the meal plan to get finalized, and then validate the outcome. This prober ran successfully for most of three or so weeks, and the service handled everything like a champ.

That said, it was VERY expensive. When I was building this in December, I would start my evening at about 7:30PM by deploying and having Terraform spin everything up, and then I would have Terraform Cloud destroy whatever inventory was present by 1:30AM. Nonetheless, my bill for December was $130-ish. I realized the Aurora problem, switched to RDS, and got rid of a lot of the lambdas to simply the application and consequent bill. I let the new iteration run for almost a month and was headed towards another $120 bill, which I think means the old system would have cost something like $190/month if I hadn’t swapped databases.

January’s bill charges me $27.29 for RDS and $35.05 for the VPC endpoints the Lambdas needed to talk to AWS services. Lambda, SQS, SSM, etc. cost me nothing. ECS cost me $15.

### What’s next?

I don’t want to keep building on AWS, because it feels like going to a sleepover at the house of a girl who has told everyone she hates you. I don’t know where I’ll go next with all of this. GCP has been rumored to be going away, and even if it’s probably safe to disregard those rumors, they nevertheless sow the seed of doubt. Azure doesn’t feel ready yet. DigitalOcean has an app platform now that I might try out. Oh fuck, Kubernetes?

### Conclusions

The biggest lesson I’ve learned through this endeavor is that AWS assumes you have access to some VC-backed bank account, and thus litter their landscape with pitfalls and traps where you have no choice but to give them more money. It’s not enough that you’d write your congressman about, nobody writes their congressman about a $35 business expense. It is more than enough, however, to make me realize I’m not working with a partner, I’m working with a parasite.