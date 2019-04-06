FROM jojomi/hugo:0.53 AS build-stage

ADD . .

RUN hugo --destination /blog --baseURL="https://blog.verygoodsoftwarenotvirus.ru"

FROM nginx:latest

COPY --from=build-stage /blog /blog
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
