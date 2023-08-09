resource "google_project_service" "artifactregistry" {
  service = "artifactregistry.googleapis.com"
}

resource "google_project_service" "cloudbuild" {
  service = "cloudbuild.googleapis.com"
}

resource "google_project_service" "cloudfunctions" {
  service = "cloudfunctions.googleapis.com"
}

resource "google_project_service" "cloudresourcemanager" {
  service = "cloudresourcemanager.googleapis.com"
}

resource "google_project_service" "containerregistry" {
  service = "containerregistry.googleapis.com"
}

resource "google_project_service" "iam" {
  service = "iam.googleapis.com"
}

resource "google_project_service" "eventarc" {
  service = "eventarc.googleapis.com"
}

resource "google_project_service" "run" {
  depends_on = [google_project_service.iam]
  service    = "run.googleapis.com"
}

resource "google_project_service" "appsmarket_component" {
  service = "appsmarket-component.googleapis.com"
}

resource "google_project_service" "sheets" {
  service = "sheets.googleapis.com"
}

resource "google_project_service" "analyticsadmin" {
  service = "analyticsadmin.googleapis.com"
}

module "manager_api" {
  common = local.common
  source = "../api"
}
