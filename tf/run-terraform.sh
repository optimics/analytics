#!/usr/bin/env bash

set -e
dir=$1
workspace=$2

if [[ "$dir" == "" ]]; then
  echo "Missing directory path as first argument"
  exit 4
fi

if [[ "$TF_VAR_GOOGLE_CREDENTIALS" == "" ]]; then
  echo "Missing TF_VAR_GOOGLE_CREDENTIALS"
  exit 2
fi

if [[ "$TF_VAR_BUCKET_TERRAFORM" == "" ]]; then
  echo "Missing TF_VAR_BUCKET_TERRAFORM"
  echo "We use GCP state provider by default, so terraform needs a bucket name"
  exit 3
fi

cd $dir
cred_file="terraform-credentials.json"
touch $cred_file
cred_file_path=$(realpath $cred_file)
export GOOGLE_APPLICATION_CREDENTIALS="$cred_file_path"
echo -E "$TF_VAR_GOOGLE_CREDENTIALS" >> $cred_file_path
gcloud auth activate-service-account --key-file=$cred_file_path
terraform init --backend-config "bucket=$TF_VAR_BUCKET_TERRAFORM"

if [[ "$workspace" != "" ]]; then
  terraform workspace select --or-create $workspace
fi

terraform apply --input=false --auto-approve
