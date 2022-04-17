---
title: "Baby's First GCP Deployment"
date: 2022-01-29T23:34:37-06:00
draft: true
---

### Background

In [my last article](https://blog.verygoodsoftwarenotvirus.ru/posts/babys-first-aws/), I talked about my endeavor to get a side project I've been working on deployed to a professional cloud, specifically AWS. To briefly summarize, it didn't end up going to plan, and proved to be very very expensive to host a very simple application. I still want to host this application somewhere, so I started to look at alternatives to AWS for deployment.

### The hunt

At the end of the AWS affair, I was left with a lot of indecision and fatigue. I liked using AWS, I just didn't like paying for it, so I was hoping I could get some similar level of service quality for about 1/4 of the price if at all possible. When I thought about all the moving bits and pieces of the application, it just didn't feel like this thing should cost more than, say, $50 at most to host per month. 

What I wanted from a provider on the technical side was simply a way to ship a docker container and have that provider put it on the internet. Let me connect that container to a database, maybe some object storage, and a queue, and I'll be good to go. 

### First Candidate: DOAP

I started to look at [DigitalOcean's App Platform](https://www.digitalocean.com/products/app-platform), which seemed to touch a lot of these bases. I could define a container that was my app, give them some details about how to connect it to a database and the internet, and leave the rest to them.

After playing with this for about a day and a half, I ended up deciding against it. It seemed to work well enough, but I also felt like I was touching the outer limits of when to use the Platform. Like if my app decided to do even one more thing, I wouldn't be able to host it in App Platform anymore. 

It felt like the target audience for App Platform are agencies, folks approached by nontechnical parties who need a specific kind of application to be made and hosted. I could see a workflow where you basically just have one App Platform definition you use to deploy any number of Wordpress sites or whatever. 

### DigitalOcean shortcomings

One thing I made very heavy use of on AWS was managed services, specifically RDS and SQS. Being able to have a queue without having to worry about that queue's infrastructure was very very nice, but DigitalOcean has no analog for these. You could probably write up an App Platform template for deploying a containerized version of [NATS](https://nats.io) or whatever, and [they do have a managed Redis offering](https://www.digitalocean.com/products/managed-databases-redis), but it's much more expensive than SQS, and I just sort of liked not having to think about it as anything other than a generic queue.

### Kubernetes

One thing DO does have that is actually priced fairly decently is their managed Kubernetes offering. Previously I have stated that using Kubernetes is a mistake until proven otherwise. I violated these tenets and explored using Kubernetes for this app in DigitalOcean for about 3 days before I gave up. I was right all along, it seems.

I could probably write an article just on why Kubernetes didn't work out, but I'll spare us all the misery. I got as far as having a local Kubernetes setup for the app that worked, but could never manage to get the one in DigitalOcean connected to the public internet.

### Where to?

So I've fully ruled out DigitalOcean, both App Platform and the Kubernetes offering, which leaves only Azure and GCP.

Azure has a container hosting solution that sounds most akin to ECS called [Azure Container Apps](https://azure.microsoft.com/en-us/services/container-apps/#features), but it's in preview, and was launched [very recently](https://azure.microsoft.com/en-us/updates/public-preview-azure-container-apps/). As such, I don't really have a lot of confidence developing for the platform. They also have [AKS](https://azure.microsoft.com/en-us/services/kubernetes-service/#overview), a managed Kubernetes offering, but I'm not doing that either, for reasons we've discussed.

I've used GCP before in my career and for side projects. I had a [fairly successful endeavor a few years ago](https://blog.verygoodsoftwarenotvirus.ru/posts/the-story-of-porktrack/) to redeploy an old application to Cloud Run that went very well. When I worked at WP Engine, we made very heavy use of GCP for all of our internal software and a not insignificant chunk of our actual business offering as well, so I had a distant impression of its reliability. I decided to give it a shot.

### App recap

To briefly recall the app we're talking about and it's needs, it's a meal management app. You put in recipes, plan meals out for the week from those recipes, and allow others in your household to participate. From a technical perspective, it needs a database, an event queue, and something to respond to events that arrive in the queue by executing accompanying code.

I decided to use [Cloud Run](https://cloud.google.com/run) to host the server container, [Cloud SQL](https://cloud.google.com/sql) for the database, [Cloud Pub/Sub](https://cloud.google.com/pubsub) for the event queue, and [Cloud Functions](https://cloud.google.com/functions) for the event responders.

### GCP Terraform Obstacles

One goal I maintained from the prior effort was to have it so that the full environment could be spun up from nothing. That I could take a bare project with no resources and after one CI task run, have the full app running and available. This was beneficial last time in reducing costs, since I could use Terraform to destroy everything in one run if I met this condition.

AWS allowed me to accomplish this particular goal. I could go from having nothing to the full environment up in 30 minutes, with no preconfiguration in my AWS account other than the Terraform Cloud user stuff (which I'm not counting).

GCP, however, had a bunch of hurdles in the way for me. For one, every API needs explicit authorization.

- Want to create a container registry? You must first enable the [Container Registry API](https://console.cloud.google.com/apis/library/containerregistry.googleapis.com).
- Want to administer Cloud SQL databases? You must first enable the [Cloud SQL Admin API](https://console.cloud.google.com/apis/library/sqladmin.googleapis.com).
- Want to administer Cloud Run instances? You must first enable the [Cloud Run Admin API](https://console.cloud.google.com/apis/library/run.googleapis.com).

After a while of playing whack-a-mole, I discovered what I thought would be a shortcut to this step:

1. Enable the Cloud Resource Manager API
1. Use Terraform to enable all the stuff I'd need with the [google_project_service resource](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/google_project_service).

This didn't work. In fact, it did the opposite of working. Because I (foolishly) decided to add a bunch of the aforementioned resources that I had already enabled by hand, and hadn't granted the lesser Terraform Cloud user rights to disable these things, it really mucked up my Terraform state. Thankfully, cleaning that up is easy, but I learned so that you don't have to, hopefully.

Additionally, for things like Domain verification (ugh), there didn't immediately appear to be a good way of doing that automatically, which I'm not exactly against.

I will say, the GCP terraform provider does a better job of catching errors in the `terraform validate` process. Many times with the AWS work, I would have something pass `validate`, but fail to `apply` for somethign that could have totally been caught in `validate`. I very much appreciate whoever is responsible for this improvement.

## IAM woes

IAM is also pretty confusing. In the console, users are called `Principals`, but in some old docs and guides, they seem to just be called `Users`? Users can have roles and service accounts, and those service accounts can have a subset of roles. I think I've recalled all this correctly, but I'm not confident I have!

Another thing that threw me for a loop was how to create a user for the Cloud Run API service. The Terraform definition has space for a Service Account ID, so I created a service account in Terraform and assigned it the `Secret Manager Secret Accessor` role, only Terraform gave me an error:

```
│ Error: Error setting IAM policy for service account 'projects/xxxxxxxxxxx/serviceAccounts/api-server@xxxxxxxxxxx.iam.gserviceaccount.com': googleapi: Error 400: Role roles/secretmanager.secretAccessor is not supported for this resource., badRequest
```
<sub>(yes, the `., badRequest` thing is really in there)</sub>

So I needed a `Principal`, and it took me a while to figure out the right incantation of Terraform to produce it, because they are not named kindly:

```
resource "google_service_account" "api_server_account" {
  account_id   = "api-server"
  display_name = "API Server"
}

resource "google_project_iam_member" "api_server_user" {
  project = local.project_id
  role    = "roles/viewer"
  member  = format("serviceAccount:%s", google_service_account.api_server_account.email)
}
```

From there you can grant that principal specific roled permissions:

```
resource "google_project_iam_binding" "api_user_secret_accessor" {
  project = local.project_id
  role    = "roles/secretmanager.secretAccessor"

  members = [
    google_project_iam_member.api_server_user.member,
  ]
}
```

and then assign it to your Cloud Run app:

```
resource "google_cloud_run_service" "api_server" {
  name     = "api-server"
  location = "us-central1"

  traffic {
    percent         = 100
    latest_revision = true
  }

  autogenerate_revision_name = true


  template {
    spec {
      service_account_name = google_service_account.api_server_account.email
    }
  }

  # yadda yadda yadda
}
```

This, combined with some new code to handle environment-mounted secrets, lead to my first "successful" deployment to Cloud Run. Only I couldn't access it because I hadn't granted `allUsers` the permission to invoke this particular Cloud Run application. I nice default, I think, but requires more terraform IAM finagling:

```
data "google_iam_policy" "public_access" {
  binding {
    role = "roles/run.invoker"
    members = [
      "allUsers",
    ]
  }
}

resource "google_cloud_run_service_iam_policy" "public_access" {
  location = google_cloud_run_service.api_server.location
  project  = google_cloud_run_service.api_server.project
  service  = google_cloud_run_service.api_server.name

  policy_data = data.google_iam_policy.public_access.policy_data
}
```

This is called out in [the Terraform docs for GCP's Cloud Run resource](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/cloud_run_service#example-usage---cloud-run-service-noauth), but it's called `noauth`, which I managed to not parse as "make public".

## Cloud run DNS woes

Another thing I couldn't manage to automate my way out of was the explicit domain name association that GCP requires for Cloud Run. When you create a Cloud Run service, you get a url like `https://app-name-blahblahblah.run.app`, which you can't just CNAME because of DNS. So you instead have to create a `Domain Mapping` that seems to tell Google's routers "it's okay to respect this other domain". The IAM around this is really funky, though. [The Cloud Run IAM Roles documentation](https://cloud.google.com/run/docs/reference/iam/roles) page explicitly calls out that:

```
Roles only apply to Cloud Run services, they do not apply to Cloud Run domain mappings. The Project > Editor role is needed to create or update domain mappings.
```

"So much for my preciously curated list of permissions, stupid Terraform has to be an editor!" I cursed. Only it turned out that even wheN I granted it that permission, Terraform still couldn't manage the domain mapping. I kept getting the same error over and over again:

```

│ Error: Error waiting to create DomainMapping: resource is in failed state "Ready:False", message: Caller is not authorized to administer the domain 'web.site'. If you own 'web.site', you can obtain authorization by verifying ownership of the domain, or any of its parent domains, via the Webmaster Central portal: https://www.google.com/webmasters/verification/verification?domain=web.site. We recommend verifying ownership of the largest scope you wish to use with subdomains (eg. verify 'example.com' if you wish to map 'subdomain.example.com').
```

That link would take me to a page that gleefully told me I had already verified it. I think it was just the case that the Terraform user isn't the explicit owner of the Domain like I am? Honestly not sure what happened here. I resolved to manage the damn mapping myself if I had to.

## Cloud Functions vs. Lambda

When I used Lambda, I quite liked that I could provide it a compiled binary in a zip folder. It felt a little old fashioned, but it definitely worked. Cloud Functions works with a little more magic. Rather than provide a binary, you upload code to a Google Cloud Storage bucket, and that sets up a Cloud Build trigger, which runs a preconfigured script against the code in question depending on your chosen runtime. Getting even a simple cloud function to upload via Terraform proved very difficult for me.

The long and short of it is, while nearly all the examples provided work, they do so because they don't use anything but the standard library. If you want to use any of your own code as libraries in your Cloud Function, you basically have to have a go.mod file _per Cloud Function._ This is pretty different from how I write Go code day-to-day, where I generally have one `go.mod` file per repository. No big whoop, it actually makes sense in part because the latest version of Go supported by Cloud Functions is 1.16, and I've been using 1.17 for a while, but I can specify 1.16 in the custom mod file.

Building Cloud Function artifacts [can be done with the `pack` CLI]() for local testing, but you can't ship those artifacts to Cloud Functions, you can only ship raw code to be built by Cloud Build. Maybe it's documented somewhere, but this whole build process is very opaque and yields confusing errors that don't aid in diagnosis. Some examples:

```
Info 2022-02-08 19:48:39.274 CST Step #1 - "build": ERROR: No buildpack groups passed detection.
Info 2022-02-08 19:48:39.274 CST Step #1 - "build": ERROR: Please check that you are running against the correct path.
Info 2022-02-08 19:48:39.274 CST Step #1 - "build": ERROR: failed to detect: no buildpacks participating
```
(I was uploading a .zip that had an empty folder in it)

```
Info 2022-02-08 22:26:55.090 CST Step #1 - "build": Running "go run /cnb/buildpacks/google.go.functions-framework/0.9.4/converter/get_package/main.go -dir /workspace/serverless_function_source_code (GOCACHE=/layers/google.go.functions-framework/gcpbuildpack-tmp/app)"
Info 2022-02-08 22:26:55.270 CST Step #1 - "build": 2022/02/09 04:26:55 Unable to extract package name and imports: unable to find Go package in /workspace/serverless_function_source_code.
Info 2022-02-08 22:26:55.272 CST Step #1 - "build": exit status 1
Info 2022-02-08 22:26:55.278 CST Step #1 - "build": Done "go run /cnb/buildpacks/google.go.functions-framework/0.9.4/c..." (187.47553ms)
Info 2022-02-08 22:26:55.278 CST Step #1 - "build": Failure: (ID: 7a420ccf) 2022/02/09 04:26:55 Unable to extract package name and imports: unable to find Go package in /workspace/serverless_function_source_code.
Info 2022-02-08 22:26:55.278 CST Step #1 - "build": exit status 1
```
(no root-level Go file)

```
Info 2022-02-09 23:25:32.516 CST Step #1 - "build": Done "go list -m" (4.498213ms)
Info 2022-02-09 23:25:32.516 CST Step #1 - "build": Failure: (ID: 03a1e2f7) ...ry.io/otel/exporters/otlp/internal/retry@v1.3.0: is explicitly required in go.mod, but not marked as explicit in vendor/modules.txt
Info 2022-02-09 23:25:32.516 CST Step #1 - "build": go.opentelemetry.io/otel/exporters/otlp/otlpmetric@v0.26.0: is explicitly required in go.mod, but not marked as explicit in vendor/modules.txt
Info 2022-02-09 23:25:32.516 CST Step #1 - "build": go.opentelemetry.io/otel/exporters/otlp/otlpmetric/otlpmetricgrpc@v0.26.0: is explicitly required in go.mod, but not marked as explicit in vendor/modules.txt
Info 2022-02-09 23:25:32.516 CST Step #1 - "build": go.opentelemetry.io/otel/exporters/otlp/otlptrace@v1.3.0: is explicitly required in go.mod, but not marked as explicit in vendor/modules.txt
Info 2022-02-09 23:25:32.516 CST Step #1 - "build": go.opentelemetry.io/otel/internal/metric@v0.26.0: is explicitly required in go.mod, but not marked as explicit in vendor/modules.txt

...a few dozen more of those

Info 2022-02-09 23:25:32.516 CST Step #1 - "build": To ignore the vendor directory, use -mod=readonly or -mod=mod.
Info 2022-02-09 23:25:32.516 CST Step #1 - "build": To sync the vendor directory, run:
Info 2022-02-09 23:25:32.516 CST Step #1 - "build": go mod vendor
```
(this was from trying to not have more than one go.mod file. I'd never seen this error in any Go I've ever written before.)

```
 - "build": Failure: (ID: 7a966edd) vendored dependencies must include "github.com/GoogleCloudPlatform/functions-framework-go"; if your function does not depend on the module, please add a blank import: `_ "github.com/GoogleCloudPlatform/functions-framework-go/funcframework"`
```
(the why behind this is never really explained, but I'm not worried about a random empty import)

All said and done, it took me two evenings staying up to 1:30 or so to get all the lights to turn green.

## Cloud Function woes

I kept trying to diagnose why the finalizer was failing, and it didn't seem to matter what I changed in code, the subsequent logs would never show up. I eventually figured out that Terraform wasn't updating my Cloud Function at all. It was still on version 1, despite a dozen or so "successful" deploys. It turned out [I wasn't the only person who had experienced this](https://github.com/hashicorp/terraform-provider-google/issues/1938), and after applying that solution, was finally able to start debugging in proper form.

After some normal user errors, I encountered an issue getting my now-running Cloud Function to connect to the database.


```
Cloud SQL connection failed. Please see https://cloud.google.com/sql/docs/mysql/connect-overview for additional details: ensure that the account has access to "xxxxxxxx-dev:us-central1:dev" (and make sure there's no typo in that name). Error during generateEphemeral for xxxxxxxx-dev:us-central1:dev: googleapi: Error 403: The client is not authorized to make this request., notAuthorized
```
(funnily enough, every time I get errors related to this they link to the mysql docs even though I'm using the Postgres version of CloudSQL. I let it pass because you can easily navigate to the Postgres version of those docs)

## Cloud Run woes

I experienced a similar phenomenon with Cloud Run, that is, I'd be updating code and a new revision wouldn't be deployed. I realized I was probably asking too much of Terraform here, so I tried to go about it via the official Github Action for deploying Cloud Run services. Only I encountered an error:

```
ERROR: (gcloud.run.deploy) PERMISSION_DENIED: Permission 'iam.serviceaccounts.actAs' denied on service account api-server@prixfixe-dev.iam.gserviceaccount.com (or it may not exist).
```

After some searching, I happened upon [this StackOverflow answer]() for precisely this problem and realized I needed to add the `Service Account User` permission to my Github Deployer IAM Principal. This caused my next deploy to work, but the one after that failed with the familiar error message. I discovered that somehow the `Service Account User` role was being removed from the Google Actions user after each deploy. So I put the relevant permission (`iam.serviceaccounts.actAs`) in a custom role and gave that role to the Actions user. That worked, and I could continue deploying without interruption.

## Google Cloud Console

I quite like it, actually. It's just as easy to find things as AWS. One complaint is that the interface, at times, completely fails to work if you disable common NoScript domains like `googletagmanager.com`.

<!-- screenshots here? -->

## static site woes

 When I tried to create a bucket with the appropriate name for my domain in GCP, I encountered this error:

 ```
 The bucket you tried to create is a domain name owned by another user
 ```

 This ended up being that my Terraform service account user wasn't listed as an owner of the domain in the Webmaster controls. Adding it was easy enough, but the form didn't trim whitespace, so complained that the service account I provided it with (which has a `.iam.gserviceaccount.com` domain name) was not a valid Google account. Deleting the very hard to discern leading space was hte ticket, though.
