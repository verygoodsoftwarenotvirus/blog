+++
title = "Bring your own interface"
date = "2023-08-29T23:04:56-06:00"
author = "verygoodsoftwarenotvirus"
cover = ""
tags = []
keywords = []
description = ""
showFullContent = false
readingTime = true
+++

I have a side project which, like most good software, uses a [structured logger](https://stackify.com/what-is-structured-logging-and-why-developers-need-it/). Initially I used [logrus](https://github.com/sirupsen/logrus), then I used [zap](https://github.com/uber-go/zap), and then I found [zerolog](https://github.com/rs/zerolog), which I’ve used now for a number of years. 

How did I switch loggers as many times without causing myself a headache? Easy, I maintained a simple Logger interface:

```go
type Logger interface {
	Info(string)
	Debug(string)
	Error(err error, whatWasHappeningWhenTheErrorOccurred string)
	WithValue(string, any) Logger
	WithValues(map[string]any) Logger
	WithRequest(*http.Request) Logger
	WithResponse(response *http.Response) Logger
	WithError(error) Logger
	WithSpan(span trace.Span) Logger
}
```

At every place in the code that has even the slight inclination of needing to log, I use this `Logger` type. This stands in contrast with most of the professional code I’ve written which makes use of a dependency-specific `*zap.Logger` everywhere. When I wanted to use zap instead of logrus, I very simply wrote a zap implementation of the above interface, and made use of it instead of the logrus one. They’re very shallow wrappers; here’s what `WithValue` looks like for the zap implementation, for example:

```go
func (l *zapLogger) WithValue(key string, value any) logging.Logger {
	return &zapLogger{logger: l.logger.With(zap.Any(key, value))}
}
```

The way the app conjures a `Logger` instance is from a logging-specific `Config` object, which has a method for providing a logger:

```go
func (cfg *Config) ProvideLogger() logging.Logger {
	if cfg == nil {
		return logging.NewNoopLogger()
	}

	switch cfg.Provider {
	case ProviderZerolog:
		return zerolog.NewZerologLogger(cfg.Level)
	case ProviderZap:
		return zap.NewZapLogger(cfg.Level)
	default:
		return logging.NewNoopLogger()
	}
}
```

Having things configured this way makes it trivial to switch between logging instances. I can change one line of config and have the entire application’s logging behavior change in response.

# New Toys

Recently Go 1.21 introduced [the slog package](https://pkg.go.dev/log/slog), which is the standard library implementation of a structured logger like those I mentioned above. I immediately wanted to make use of it (and I think it might even make sense to one day rip my interface out and just use a `*slog.Logger` instead). To make use of it in the meantime, I was able to start making use of slog in my app by:

1. writing a `slog`-compatible implementation of the `logging.Logger` interface and 
2. changing the config to specify that the `slog` logging provider should be used.
3. adding a case to the above switch statement to account for the new `ProviderSlog` option.

One quick PR and the whole app uses `slog` now. 

It doesn’t stop at logging. I have similar interfaces for:

- message queues (Redis, SQS, Pub/Sub)
- search indices (Algolia, Elasticsearch)
- talking to analytics providers (Segment, PostHog)
- feature flag checking (LaunchDarkly, PostHog, Split)
- sending emails through a service (Segment, Mailjet, Mailgun)
- object storage (S3, GCS, local disk)

At any moment, the primary implementation provider for these core functions can be changed with a simple config update. 

What makes a good use case for this pattern? 

1. The functionality should have a core purpose that probably won’t meaningfully change. For instance, the message queue code will only ever deal with reading from or writing to message queues. At no point will it suddenly also be responsible for sending emails. Logging packages will only ever be responsible for logging values, etc. 
2. There should also be a number of reasonable implementations. There are many logging libraries, email service providers, and there will be more of them in the future, too.
3. Little meaningful impact on switching between said providers. For example, I have an `authentication` package, which is responsible for verifying TOTP codes and checking submitted passwords against their hashes. I could hypothetically have a `bcrypt` implementation, and an `scrypt` implementation, but instead I only have an `argon2id` implementation, because if I were to suddenly switch from that to scrypt, nothing stored in the database would ever work properly barring a huge migration I wouldn’t want to account for in my implementation.

Adopting this pattern gives you flexibility at the cost of having to write a bit of glue code (like the Config stuff I showed above). Another benefit of this is that you get to define what you really need that interface for. Notice, for instance, that I don’t have a `Warn` method in my Logger interface. That’s because I basically never log at that level in practice. This is just a personal quirk of mine, I don’t know when you’d `Warn` in the API server code I write, so I just never found a need to implement it.
