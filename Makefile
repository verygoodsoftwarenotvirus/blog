.PHONY: local-docker-image
local-docker-image:
	docker build --tag=local_blog:latest --file=deploy/Dockerfile .

.PHONY: serve-local
serve-local: local-docker-image
	docker run --publish 8080:8080 local_blog:latest

.PHONY: docker-image
docker-image:
	docker build --tag=docker.io/blog:latest --file=deploy/Dockerfile .

.PHONY: publish
publish: docker-image
	docker build -t docker.io/verygoodsoftwarenotvirus/blog:latest --file=deploy/Dockerfile .
	docker push docker.io/verygoodsoftwarenotvirus/blog:latest
