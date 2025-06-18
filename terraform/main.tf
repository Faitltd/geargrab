# GearGrab Infrastructure as Code
# Terraform configuration for staging and production environments

terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
  
  # Configure remote state storage
  backend "gcs" {
    bucket = "geargrab-terraform-state"
    prefix = "terraform/state"
  }
}

# Variables
variable "environment" {
  description = "Environment name (staging or production)"
  type        = string
  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "Environment must be either 'staging' or 'production'."
  }
}

variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "us-central1"
}

variable "service_name" {
  description = "Cloud Run service name"
  type        = string
  default     = "geargrab-app"
}

variable "domain_name" {
  description = "Domain name for the service"
  type        = string
  default     = ""
}

variable "min_instances" {
  description = "Minimum number of instances"
  type        = number
  default     = 0
}

variable "max_instances" {
  description = "Maximum number of instances"
  type        = number
  default     = 10
}

variable "cpu_limit" {
  description = "CPU limit for the service"
  type        = string
  default     = "2"
}

variable "memory_limit" {
  description = "Memory limit for the service"
  type        = string
  default     = "1Gi"
}

# Local values for environment-specific configuration
locals {
  is_production = var.environment == "production"
  
  # Environment-specific settings
  min_instances = local.is_production ? 1 : 0
  max_instances = local.is_production ? 20 : var.max_instances
  cpu_limit     = local.is_production ? "2" : var.cpu_limit
  memory_limit  = local.is_production ? "2Gi" : var.memory_limit
  
  # Feature flags
  feature_flags = {
    staging = {
      FEATURE_COMMENTS     = "true"
      FEATURE_PAYMENTS     = "false"
      FEATURE_ADMIN_PANEL  = "false"
      FEATURE_ANALYTICS    = "false"
    }
    production = {
      FEATURE_COMMENTS     = "true"
      FEATURE_PAYMENTS     = "true"
      FEATURE_ADMIN_PANEL  = "true"
      FEATURE_ANALYTICS    = "true"
    }
  }
  
  current_features = local.feature_flags[var.environment]
}

# Configure the Google Cloud Provider
provider "google" {
  project = var.project_id
  region  = var.region
}

# Enable required APIs
resource "google_project_service" "required_apis" {
  for_each = toset([
    "run.googleapis.com",
    "cloudbuild.googleapis.com",
    "containerregistry.googleapis.com",
    "iam.googleapis.com",
    "cloudresourcemanager.googleapis.com"
  ])
  
  project = var.project_id
  service = each.value
  
  disable_on_destroy = false
}

# Cloud Run Service
resource "google_cloud_run_service" "geargrab_app" {
  name     = var.service_name
  location = var.region
  project  = var.project_id

  template {
    metadata {
      annotations = {
        "autoscaling.knative.dev/minScale" = tostring(local.min_instances)
        "autoscaling.knative.dev/maxScale" = tostring(local.max_instances)
        "run.googleapis.com/execution-environment" = "gen2"
      }
    }

    spec {
      container_concurrency = 80
      timeout_seconds      = 300

      containers {
        image = "gcr.io/${var.project_id}/${var.service_name}:latest"
        
        resources {
          limits = {
            cpu    = local.cpu_limit
            memory = local.memory_limit
          }
        }

        ports {
          container_port = 3000
        }

        env {
          name  = "NODE_ENV"
          value = var.environment
        }

        env {
          name  = "PORT"
          value = "3000"
        }

        # Feature flags
        dynamic "env" {
          for_each = local.current_features
          content {
            name  = env.key
            value = env.value
          }
        }

        # Database URL from Secret Manager
        env {
          name = "DATABASE_URL"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.database_url.secret_id
              key  = "latest"
            }
          }
        }

        # Firebase configuration from Secret Manager
        env {
          name = "FIREBASE_ADMIN_PRIVATE_KEY"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.firebase_private_key.secret_id
              key  = "latest"
            }
          }
        }
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  depends_on = [google_project_service.required_apis]
}

# IAM policy for Cloud Run service (allow unauthenticated access)
resource "google_cloud_run_service_iam_member" "public_access" {
  service  = google_cloud_run_service.geargrab_app.name
  location = google_cloud_run_service.geargrab_app.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Secret Manager secrets
resource "google_secret_manager_secret" "database_url" {
  secret_id = "${var.service_name}-database-url-${var.environment}"
  project   = var.project_id

  replication {
    automatic = true
  }

  depends_on = [google_project_service.required_apis]
}

resource "google_secret_manager_secret" "firebase_private_key" {
  secret_id = "${var.service_name}-firebase-key-${var.environment}"
  project   = var.project_id

  replication {
    automatic = true
  }

  depends_on = [google_project_service.required_apis]
}

# Domain mapping (only for production)
resource "google_cloud_run_domain_mapping" "geargrab_domain" {
  count    = var.domain_name != "" ? 1 : 0
  location = var.region
  name     = var.domain_name
  project  = var.project_id

  metadata {
    namespace = var.project_id
  }

  spec {
    route_name = google_cloud_run_service.geargrab_app.name
  }

  depends_on = [google_cloud_run_service.geargrab_app]
}

# WWW domain mapping (only for production)
resource "google_cloud_run_domain_mapping" "geargrab_www_domain" {
  count    = var.domain_name != "" ? 1 : 0
  location = var.region
  name     = "www.${var.domain_name}"
  project  = var.project_id

  metadata {
    namespace = var.project_id
  }

  spec {
    route_name = google_cloud_run_service.geargrab_app.name
  }

  depends_on = [google_cloud_run_service.geargrab_app]
}

# Service Account for Cloud Run
resource "google_service_account" "cloud_run_sa" {
  account_id   = "${var.service_name}-${var.environment}"
  display_name = "GearGrab ${title(var.environment)} Service Account"
  description  = "Service account for GearGrab ${var.environment} environment"
  project      = var.project_id
}

# IAM bindings for the service account
resource "google_project_iam_member" "cloud_run_sa_bindings" {
  for_each = toset([
    "roles/secretmanager.secretAccessor",
    "roles/cloudsql.client",
    "roles/storage.objectViewer"
  ])
  
  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}

# Outputs
output "service_url" {
  description = "URL of the Cloud Run service"
  value       = google_cloud_run_service.geargrab_app.status[0].url
}

output "service_name" {
  description = "Name of the Cloud Run service"
  value       = google_cloud_run_service.geargrab_app.name
}

output "domain_mapping_status" {
  description = "Status of domain mappings"
  value = var.domain_name != "" ? {
    main_domain = google_cloud_run_domain_mapping.geargrab_domain[0].status
    www_domain  = google_cloud_run_domain_mapping.geargrab_www_domain[0].status
  } : null
}

output "feature_flags" {
  description = "Current feature flags for this environment"
  value       = local.current_features
}
