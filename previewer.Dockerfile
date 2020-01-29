FROM jojomi/hugo:0.53

ADD dist /dist
ADD . .

CMD hugo server serve --port=80 --baseURL="localhost" --bind="0.0.0.0" --contentDir=/dist
