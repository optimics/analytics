variable "artifact_name" { type = string }
variable "artifact_src" { type = string }
variable "common" {}
variable "description" { type = string }
variable "entry_point" { type = string }
variable "name" { type = string }

variable "available_cpu" {
  default = 1
  type = number
}

variable "event_trigger" {
  default = null
  type    = string
}

variable "env_vars" {
  default = null
  type    = map(any)
}

variable "public" {
  type    = bool
  default = false
}

variable "event_filters" {
  default = []
  type = list(object({
    attribute = string
    operator  = optional(string)
    value     = string
  }))
}

variable "max_instances" {
  type    = number
  default = 100
}

variable "concurrency" {
  type    = number
  default = 1
}

variable "memory" {
  type    = string
  default = "256Mi"
}

variable "min_instances" {
  type    = number
  default = 0
}

variable "runtime" {
  type    = string
  default = "nodejs18"
}

variable "timeout" {
  type    = number
  default = 540
}

variable "pubsub_topic" {
  type    = string
  default = null
}

variable "runtime_user" {
  type    = string
  default = ""
}

locals {
  event_triggers = var.event_trigger == null ? [] : [var.event_trigger]
  runtime_user   = var.runtime_user == "" ? var.common.user : var.runtime_user
}

resource "google_storage_bucket_object" "cf_archive" {
  bucket   = var.common.bucket_terraform
  name     = var.artifact_name
  source   = var.artifact_src
  metadata = {}
}

resource "google_pubsub_topic" "trigger_topic" {
  count = var.pubsub_topic == null ? 0 : 1
  name  = var.pubsub_topic
}

resource "google_cloudfunctions2_function" "cf" {
  depends_on = [
    google_pubsub_topic.trigger_topic,
    google_storage_bucket_object.cf_archive,
  ]
  description = var.description
  location    = var.common.region
  name        = var.name

  build_config {
    runtime     = var.runtime
    entry_point = var.entry_point
    source {
      storage_source {
        bucket = var.common.bucket_terraform
        object = google_storage_bucket_object.cf_archive.name
      }
    }
  }

  service_config {
    available_cpu = var.available_cpu
    available_memory                 = var.memory
    environment_variables            = var.env_vars
    max_instance_request_concurrency = var.concurrency
    max_instance_count               = var.max_instances
    min_instance_count               = var.min_instances
    service_account_email            = local.runtime_user
    timeout_seconds                  = var.timeout
  }

  dynamic "event_trigger" {
    for_each = local.event_triggers
    content {
      event_type            = event_trigger.value
      pubsub_topic          = var.pubsub_topic == null ? null : google_pubsub_topic.trigger_topic[0].id
      retry_policy          = "RETRY_POLICY_DO_NOT_RETRY"
      service_account_email = local.runtime_user
      trigger_region        = var.common.region
      dynamic "event_filters" {
        for_each = var.event_filters
        content {
          attribute = event_filters.value.attribute
          value     = event_filters.value.value
        }
      }
    }
  }
}

resource "google_cloudfunctions2_function_iam_binding" "public_binding" {
  count = var.public ? 1 : 0
  project = google_cloudfunctions2_function.cf.project
  location = google_cloudfunctions2_function.cf.location
  cloud_function = google_cloudfunctions2_function.cf.name
  role = "roles/cloudfunctions.invoker"
  members = ["allUsers"]
}

resource "google_cloud_run_service_iam_binding" "binding" {
  count = var.public ? 1 : 0
  project = google_cloudfunctions2_function.cf.project
  location = google_cloudfunctions2_function.cf.location
  service = google_cloudfunctions2_function.cf.name
  role = "roles/run.invoker"
  members = ["allUsers"]
}

output "function_uri" {
  value = google_cloudfunctions2_function.cf.service_config[0].uri
}
