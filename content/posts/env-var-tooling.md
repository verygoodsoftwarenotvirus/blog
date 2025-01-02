+++
title = "The Gift of Good Tooling"
date = "2025-01-01T11:34:37-06:00"
author = "verygoodsoftwarenotvirus"
cover = ""
draft = true
tags = []
keywords = []
description = ""
showFullContent = false
readingTime = true
+++

Recently I joined a new team at work, and one my favorite parts of joining a new team is seeing what tools are and aren’t in use, and most importantly, why or why not. I don’t think I’ve ever joined a team that didn’t introduce me to a new library or utility, most good, some bad.

In today’s case, the tool I want to talk about is caarlos0’s [env](https://github.com/caarlos0/env). It’s a library that effectively allows you to map environment variables to the values of individual structs. So if I have a config struct like:

```go
type Config struct {
      Debug bool `env:"DEBUG"`
}
```

At runtime, if `Debug` is set to `false`, but the environment variable `DEBUG` is set to `true`, `config.Debug` will be `true` after I use the `env` library to load this struct.

I understood how it all worked, but didn’t understand how valuable it was until we had to diagnose a bug in production at work. We needed to disable something in production and rather than having to create a PR and go through a bunch of CI/CD rigamarole, we edited the pod’s YAML in k9s and confirmed the issue. I felt like a god and I wasn’t responsible for any of it.

My curse and blessing is that I’m the kind of person who cannot experience a great tooling experience and not immediately find a nail for that hammer. I maintain a constantly-morphing side project almost *because* it frequently gives me that nail. 

One hangup I had about using it in my side project is documenting the consequent flags. `env` allows you to set a prefix for nested values, and the config I use in my side project is very nested. To adapt our earlier example:

```go
type DatabaseConfig struct {
      Debug bool `env:"DEBUG"`
}

type ServiceConfig struct {
      Debug bool `env:"DEBUG"`
      Database DatabaseConfig `envPrefix:"DATABASE_"`
}
```

This would allow you to set `svcCfg.Database.Debug` by setting the environment variable `DATABASE_DEBUG`. That’s all well and good, easy enough to suss out, but it’s also precisely the sort of mental toil I’m willing to spend more time than I could ever potentially save trying to avoid.

So I (with some help from ChatGPT) wrote some code to parse the AST and produce a library of string constants that document their responsibility:

```go
package main

import (
	"fmt"
	"go/ast"
	"go/parser"
	"go/token"
	"log"
	"os"
	"path/filepath"
	"slices"
	"strings"

	"github.com/<side_project>/internal/config"

	"github.com/codemodus/kace"
)

func main() {
	dir, err := os.Getwd()
	if err != nil {
		log.Fatal(err)
	}

	structs := parseGoFiles(dir)

	outputLines := []string{}
	if mainAST, found := structs["config.APIServiceConfig"]; found {
		for envVar, fieldPath := range extractEnvVars(mainAST, structs, "main", "", "") {
			outputLines = append(outputLines, fmt.Sprintf(`	// %sEnvVarKey is the environment variable name to set in order to override `+"`"+`config%s`+"`"+`.
	%sEnvVarKey = "%s%s"

`, kace.Pascal(envVar), fieldPath, kace.Pascal(envVar), config.EnvVarPrefix, envVar))
		}
	}

	slices.Sort(outputLines)

	out := fmt.Sprintf(`package envvars

/* 
This file contains a reference of all valid service environment variables.
*/

const (
%s
)
`, strings.Join(outputLines, ""))

	if err = os.WriteFile(filepath.Join(dir, "internal", "config", "envvars", "env_vars.go"), []byte(out), 0o0644); err != nil {
		log.Fatal(err)
	}
}

// parseGoFiles parses all Go files in the given directory and returns a map of struct names to their AST nodes.
func parseGoFiles(dir string) map[string]*ast.TypeSpec {
	structs := make(map[string]*ast.TypeSpec)

	err := filepath.Walk(dir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if info.IsDir() || !strings.HasSuffix(info.Name(), ".go") {
			return nil
		}

		if strings.Contains(path, "vendor") {
			return filepath.SkipDir
		}

		node, err := parser.ParseFile(token.NewFileSet(), path, nil, parser.AllErrors)
		if err != nil {
			fmt.Printf("Error parsing file %s: %v\n", path, err)
			return nil
		}

		for _, decl := range node.Decls {
			genDecl, isGenDecl := decl.(*ast.GenDecl)
			if !isGenDecl {
				continue
			}

			for _, spec := range genDecl.Specs {
				typeSpec, isTypeSpec := spec.(*ast.TypeSpec)
				if !isTypeSpec {
					continue
				}

				if _, ok = typeSpec.Type.(*ast.StructType); ok {
					key := fmt.Sprintf("%s.%s", node.Name.Name, typeSpec.Name.Name)
					structs[key] = typeSpec
				}
			}
		}
		return nil
	})

	if err != nil {
		fmt.Printf("Error walking directory: %v\n", err)
	}

	return structs
}

// getTagValue extracts the value of a specific tag from a struct field tag.
func getTagValue(tag, key string) string {
	tags := strings.Split(tag, " ")
	for _, t := range tags {
		parts := strings.SplitN(t, ":", 2)
		if len(parts) == 2 && parts[0] == key {
			return strings.Trim(parts[1], "\"")
		}
	}
	return ""
}

// handleIdent handles extracting info from an *ast.Ident node.
func handleIdent(structs map[string]*ast.TypeSpec, fieldType *ast.Ident, envVars map[string]string, currentPackage, prefixValue, fieldNamePrefix, fieldName string) {
	for key, nestedStruct := range structs {
		keyParts := strings.Split(key, ".")
		if len(keyParts) == 2 && keyParts[1] == fieldType.Name {
			if keyParts[0] == currentPackage || currentPackage == "main" {
				for k, v := range extractEnvVars(nestedStruct, structs, keyParts[0], prefixValue, fmt.Sprintf("%s.%s", fieldNamePrefix, fieldName)) {
					envVars[k] = v
				}
			}
		}
	}
}

// handleSelectorExpr handles extracting info from an *ast.SelectorExpr node.
func handleSelectorExpr(structs map[string]*ast.TypeSpec, fieldType *ast.SelectorExpr, envVars map[string]string, prefixValue, fieldNamePrefix, fieldName string) {
	if pkgIdent, isIdentifier := fieldType.X.(*ast.Ident); isIdentifier {
		pkgName := pkgIdent.Name

		fullName := fmt.Sprintf("%s.%s", pkgName, fieldType.Sel.Name)
		if nestedStruct, found := structs[fullName]; found {
			for k, v := range extractEnvVars(nestedStruct, structs, pkgName, prefixValue, fmt.Sprintf("%s.%s", fieldNamePrefix, fieldName)) {
				envVars[k] = v
			}
		}
	}
}

// extractEnvVars traverses a struct definition and collects environment variables, resolving nested structs.
func extractEnvVars(typeSpec *ast.TypeSpec, structs map[string]*ast.TypeSpec, currentPackage, envVarPrefix, fieldNamePrefix string) map[string]string {
	envVars := map[string]string{}

	structType, ok := typeSpec.Type.(*ast.StructType)
	if !ok {
		return envVars
	}

	for _, field := range structType.Fields.List {
		if field.Tag == nil {
			continue
		}

		tag := strings.Trim(field.Tag.Value, "`")
		if tag == `json:"-"` || tag == "" {
			continue
		}

		fn := field.Names[0].Name

		if envValue := getTagValue(tag, "env"); envValue != "" {
			if envVarPrefix != "" {
				envValue = envVarPrefix + envValue
			}

			if fieldNamePrefix == "" {
				envVars[envValue] = fn
			} else {
				envVars[envValue] = fmt.Sprintf("%s.%s", fieldNamePrefix, fn)
			}
		}

		if prefixValue := getTagValue(tag, "envPrefix"); prefixValue != "" {
			if envVarPrefix != "" {
				prefixValue = envVarPrefix + prefixValue
			}

			switch fieldType := field.Type.(type) {
			case *ast.Ident:
				handleIdent(structs, fieldType, envVars, currentPackage, prefixValue, fieldNamePrefix, fn)
			case *ast.SelectorExpr:
				handleSelectorExpr(structs, fieldType, envVars, prefixValue, fieldNamePrefix, fn)
			case *ast.StarExpr:
				switch ft := fieldType.X.(type) {
				case *ast.Ident:
					handleIdent(structs, ft, envVars, currentPackage, prefixValue, fieldNamePrefix, fn)
				case *ast.SelectorExpr:
					handleSelectorExpr(structs, ft, envVars, prefixValue, fieldNamePrefix, fn)
				}
			}
		}
	}

	return envVars
}

```

The only code here specific to my service is the import of a string constant `config.EnvVarPrefix`, which we’ll say for the sake of example is `SIDE_PROJECT_`, and the name of the config struct the code looks for (`config.APIServiceConfig`). Everything else *should* produce a file that looks something like this:

```go
package envvars

/*
This file contains a reference of all valid service environment variables.
*/

const (
	// ObservabilityLoggingLevelEnvVarKey is the environment variable name to set in order to override `config.Observability.Logging.Level`.
	ObservabilityLoggingLevelEnvVarKey = "SIDE_PROJECT_OBSERVABILITY_LOGGING_LEVEL"

	// ObservabilityLoggingOutputFilepathEnvVarKey is the environment variable name to set in order to override `config.Observability.Logging.OutputFilepath`.
	ObservabilityLoggingOutputFilepathEnvVarKey = "SIDE_PROJECT_OBSERVABILITY_LOGGING_OUTPUT_FILEPATH"

	// ObservabilityLoggingProviderEnvVarKey is the environment variable name to set in order to override `config.Observability.Logging.Provider`.
	ObservabilityLoggingProviderEnvVarKey = "SIDE_PROJECT_OBSERVABILITY_LOGGING_PROVIDER"

	// ObservabilityMetricsOtelCollectionIntervalEnvVarKey is the environment variable name to set in order to override `config.Observability.Metrics.Otel.CollectionInterval`.
	ObservabilityMetricsOtelCollectionIntervalEnvVarKey = "SIDE_PROJECT_OBSERVABILITY_METRICS_OTEL_COLLECTION_INTERVAL"

	// ObservabilityMetricsOtelCollectionTimeoutEnvVarKey is the environment variable name to set in order to override `config.Observability.Metrics.Otel.CollectionTimeout`.
	ObservabilityMetricsOtelCollectionTimeoutEnvVarKey = "SIDE_PROJECT_OBSERVABILITY_METRICS_OTEL_COLLECTION_TIMEOUT"

	// ObservabilityMetricsOtelCollectorEndpointEnvVarKey is the environment variable name to set in order to override `config.Observability.Metrics.Otel.CollectorEndpoint`.
	ObservabilityMetricsOtelCollectorEndpointEnvVarKey = "SIDE_PROJECT_OBSERVABILITY_METRICS_OTEL_COLLECTOR_ENDPOINT"

	/* 
	...and so on and so forth
	*/
)
```

Which documents not just every valid environment variable, but also the field name that it manipulates. As with any generated code in this project, this file [is checked for consistency in CI](https://blog.verygoodsoftwarenotvirus.ru/posts/generated-files/), so I can count on this being accurate and up to date, and I’m free to rename and move fields around at my leisure.

This took me maybe a day or so to do, and if I never encounter a need to make use of this, it will technically have been wasted time. I know myself well enough, however, to know that if I experienced failing to change a value with an outdated environment variable that I had populated by hand, I’d be cursing myself for not spending the day. If I never endeavored to document it, and I had to trawl through this expansive config keeping prefixes in mind in order to deduce what the environment variable was, I’d be cursing myself for not spending the day.

Instead, I took the day to give myself the gift of good tooling, and I can spend subsequent days worrying about the problems I’m actually trying to solve, and not letting toil get in the way of progress.
