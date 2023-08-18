variable "bucket_name" { type = string }
variable "revision" { type = string }
variable "src_dir" { type = string }

variable "clear" {
  default = false
  type = bool
}

variable "path" {
  default = null
  type = string
}

locals {
  path = join("/", compact([var.bucket_name, var.path]))
}

resource "null_resource" "sync" {
  triggers = {
    always_run = var.revision
  }

  provisioner "local-exec" {
    command = "gsutil -m rsync ${var.clear ? " -d" : ""} -r ${var.src_dir} gs://${local.path}"
  }
}
