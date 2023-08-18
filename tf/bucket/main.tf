variable "location" { type = string }
variable "name" { type = string }
variable "common" {
  type = object({
    service_account = string
  })
}

variable "origins" {
  type    = list(string)
  default = null
}

variable "public" {
  type    = bool
  default = false
}

variable "log_bucket" {
  type = string
  default = ""
}

variable "main_page_suffix" {
  type = string
  default = ""
}

variable "not_found_page" {
  type = string
  default = ""
}

locals {
  website_config = var.main_page_suffix == "" && var.not_found_page == "" ? [] : [
    {
      main_page_suffix = var.main_page_suffix
      not_found_page = var.not_found_page
    }
  ]
  logging_config = var.log_bucket == "" ? [] : [
    {
      log_bucket = var.log_bucket
      log_object_prefix = var.name
    }
  ]
  cors_config = var.public ? [
    {
      max_age_seconds = 900
      method          = ["GET", "HEAD", "OPTIONS"]
      origin          = var.origins
    }
  ] : []
}

resource "google_storage_bucket" "bucket" {
  location                    = var.location
  name                        = var.name
  uniform_bucket_level_access = true
  dynamic "cors" {
    for_each = local.cors_config
    content {
      max_age_seconds = cors.value.max_age_seconds
      method          = cors.value.method
      origin          = cors.value.origin
    }
  }
  dynamic "website" {
    for_each = local.website_config
    content {
      main_page_suffix = website.value.main_page_suffix
      not_found_page = website.value.not_found_page
    }
  }
  dynamic "logging" {
    for_each = local.logging_config
    content {
      log_bucket = logging.value.log_bucket
      log_object_prefix = logging.value.log_object_prefix
    }
  }
}

resource "google_storage_bucket_iam_binding" "service_write_access" {
  bucket  = google_storage_bucket.bucket.name
  role    = "roles/storage.objectAdmin"
  members = [
    var.common.service_account
  ]
}

resource "google_storage_bucket_iam_binding" "public_rule" {
  count  = var.public ? 1 : 0
  bucket = google_storage_bucket.bucket.name
  role   = "roles/storage.objectViewer"
  members = [
    "allUsers"
  ]
}

output "bucket" {
  value = google_storage_bucket.bucket
}

output "base_url" {
  value = google_storage_bucket.bucket.url
}
