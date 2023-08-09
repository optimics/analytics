variable "common" {}

module "npm" {
  common = var.common
  root   = path.module
  source = "github.com/optimics/forge/packages/repo/terraform/npm"
}

resource "google_service_account" "runtime" {
  account_id   = "manager"
  display_name = "GA4 Manager"
}

resource "google_service_account_key" "key" {
  service_account_id = google_service_account.runtime.name
}

module "cf" {
  artifact_name = module.npm.artifact_name
  artifact_src  = module.npm.zip_path
  common        = var.common
  description   = module.npm.description
  entry_point   = "request"
  env_vars      = {
    // @TODO: Switch to OAuth or Cloud Function runtime Service account
    GOOGLE_CREDENTIALS = base64decode(google_service_account_key.key.private_key)
  }
  memory        = "256Mi"
  name          = module.npm.ident
  public        = true
  runtime_user  = google_service_account.runtime.email
  source        = "../../../../tf/cf2"
  timeout       = 3600
}
