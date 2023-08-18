variable "BUCKET_TERRAFORM" { type = string }
variable "GCP_PROJECT" { type = string }
variable "GOOGLE_CREDENTIALS" { type = string }

variable "BUCKET_SCRIPTS" {
  default = "scripts"
  type    = string
}

variable "GCP_CONTINENT" {
  default = "EU"
  type = string
}

variable "GCP_REGION" {
  default = "europe-west1"
  type = string
}

variable "GCP_DOCKER_REPO" {
  type = string
  default = "eu.gcr.io"
}

locals {
  /*
    Assume terraform workspace matches naming convention
    "${project}-${env_stage}" and take out the stage as the underlying base
    infrastructure stage. For example "k2ng-sg" should yield "sg"
  */
  root_env_stage   = replace(terraform.workspace, "/^.+-/", "")
}

locals {
  continent   = var.GCP_CONTINENT
  production  = local.root_env_stage == "le"
  region      = var.GCP_REGION
  root_dir    = abspath("${dirname(abspath(path.module))}/../../..")
  credentials = jsondecode(var.GOOGLE_CREDENTIALS)
}

locals {
  common = {
    bucket_terraform = var.BUCKET_TERRAFORM
    bucket_scripts   = "zt-le-scripts"
    continent        = local.continent
    dist_dir         = abspath("${local.root_dir}/dist")
    docker_repo      = var.GCP_DOCKER_REPO
    production       = local.production
    project          = var.GCP_PROJECT
    region           = local.region

    /*
      There is no way to fit everything in a single region because of service
      availability. We have chosen an alternative region for low bandwidth
      services. For example Cloud Scheduler is not available everywhere.
     */
    region_low       = "europe-west1"
    root_dir         = local.root_dir
    tz               = "Europe/Prague"
    service_account  = "serviceAccount:${local.credentials.client_email}"
    /*
      All resources that need to scale across continent should be using
      `location_large`. The variable will be using local region for
      non-production environments and continent size regions for production.
     */
    location_large   = local.production ? local.continent : local.region
    
    /*
      All Cloud Function instances that need to scale to maximum should use
      this variable. It will cut max instance count for non-production
      environments to avoid extensive money loss.
    */
    max_cf_instances = local.production ? 3000 : 64
  }
}

terraform {
  backend "gcs" {
    prefix = "state"
  }
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.57.0"
    }
    github = {
      source  = "integrations/github"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project     = var.GCP_PROJECT
  region      = var.GCP_REGION
  credentials = var.GOOGLE_CREDENTIALS
}
