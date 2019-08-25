FROM google/cloud-sdk:alpine

ADD dist dist

CMD gsutil -m cp -r $(OUTPUT_DIR)/* gs://$(GCLOUD_BUCKET)/
