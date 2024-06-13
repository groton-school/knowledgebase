#!/user/bin/env bash

source "$(dirname $0)/.env"

gcloud projects create $PROJECT --folder=$FOLDER --name="Knowledgebase DEV" --format=json
gcloud billing projects link $PROJECT --billing-account=$BILLING --format=json

echo "You need to manually configure the OAuth Consent screen at https://console.cloud.google.com/apis/credentials/consent?project=$PROJECT"
gcloud services enable docs.googleapis.com --project=$PROJECT --format=json
gcloud services enable drive.googleapis.com --project=$PROJECT --format=json

# https://cloud.google.com/storage/docs/hosting-static-website#storage-create-bucket-cli
gcloud services enable compute.googleapis.com --project=$PROJECT --format=json
gcloud projects add-iam-policy-binding $PROJECT --member=$MEMBER --role=roles/storage.admin --format=json
gcloud projects add-iam-policy-binding $PROJECT --member=$MEMBER --role=roles/compute.networkAdmin --format=json
gcloud storage buckets create gs://$BUCKET --location=$LOCATION --format=json --project=$PROJECT
gcloud storage buckets update gs://$BUCKET --project=$PROJECT --public-access-prevention --no-uniform-bucket-level-access --web-main-page-suffix=index.html --web-error-page=static/404.html

# ...upload some files...
gcloud storage cp static/404.html gs://$BUCKET/static/404.html --project=$PROJECT --format=json

gcloud storage buckets add-iam-policy-binding  gs://$BUCKET --member=allUsers --role=roles/storage.objectViewer --project=$PROJECT --format=json
gcloud compute addresses create kb-ip --network-tier=PREMIUM --ip-version=IPV4 --global --project=$PROJECT --format=json
gcloud compute backend-buckets create $LB --gcs-bucket-name=$BUCKET --project=$PROJECT --format=json
gcloud compute url-maps create http-lb --default-backend-bucket=$LB --project=$PROJECT --format=json
gcloud compute target-http-proxies create http-lb-proxy --url-map=http-lb --project=$PROJECT --format=json
gcloud compute forwarding-rules create http-lb-forwarding-rule --load-balancing-scheme=EXTERNAL --network-tier=PREMIUM --address=kb-ip --global --target-http-proxy=http-lb-proxy --ports=80 --project=$PROJECT --format=json
