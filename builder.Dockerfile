FROM jojomi/hugo:latest AS build-stage

ADD . .

CMD hugo --destination /blog --minify --config=config.toml
