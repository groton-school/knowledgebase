#!/usr/bin/env sh

source "$(dirname $0)/../.env"

gcloud projects create $PROJECT --folder=$FOLDER --name="Knowledgebase DEV" --format=json
gcloud billing projects link $PROJECT --billing-account=$BILLING --format=json

gcloud services enable docs.googleapis.com --project=$PROJECT --format=json
gcloud services enable drive.googleapis.com --project=$PROJECT --format=json
gcloud services enable storage-api.googleapis.com --project=$PROJECT --format=json

gcloud projects add-iam-policy-binding $PROJECT --member=$MEMBER --role=roles/storage.admin --format=json
gcloud projects add-iam-policy-binding $PROJECT --member=$MEMBER --role=roles/compute.networkAdmin --format=json
gcloud storage buckets create gs://$BUCKET --location=$LOCATION --format=json --project=$PROJECT
gcloud storage buckets update gs://$BUCKET --project=$PROJECT --public-access-prevention --no-uniform-bucket-level-access --web-main-page-suffix=index.html --web-error-page=static/404.html

gcloud app create --region=$LOCATION --project=$PROJECT --format=json
GAE="$(gcloud app describe --project=$PROJECT --format=json | jq -r '.defaultHostname')"

mkdir -p "$(dirname $0)/../var"
echo "{\"storage\":{\"bucket\":\"$BUCKET\"}}" > "$(dirname $0)/../var/config.json"

echo "You need to manually configure the OAuth Consent screen at https://console.cloud.google.com/apis/credentials/consent?project=$PROJECT"
echo "You need to manually create and download keys for the app screen at https://console.cloud.google.com/apis/credentials?project=$PROJECT (OAuth 2.0, web, set both JavaScript origin to https://$GAE and redirect URL to https://$GAE/oauth2callback"
