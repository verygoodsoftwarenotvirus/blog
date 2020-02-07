FROM jojomi/hugo:0.53 AS build-stage

ADD . .

CMD hugo --destination /blog --minify --config=config.toml
