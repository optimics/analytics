module "npm" {
  common = local.common
  root   = "${path.module}/.."
  source = "github.com/optimics/forge/packages/repo/terraform/npm"
}

module "bucket_scripts" {
  common   = local.common
  location = local.common.region
  name     = local.common.bucket_scripts
  origins  = ["*"]
  public   = true
  source   = "../../../../tf/bucket"
}

module "scripts_upload" {
  source      = "../../../../tf/bucket_dir"
  bucket_name = local.common.bucket_scripts
  revision    = module.npm.version
  src_dir     = module.npm.dist_dir
  path        = local.common.production ? "at/${module.npm.version}" : "at/staging"
}
