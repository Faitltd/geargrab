# GearGrab Infrastructure as Code (Fixed)
terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

variable "environment" {
  description = "Environment name (staging or production)"
  type        = string
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

# Local values for environment-specific configuration
locals {
  is_production = var.environment == "production"
  
  # Environment-specific settings
  min_instances = local.is_production ? 1 : 0
  max_instances = local.is_production ? 20 : 10
  cpu_limit     = local.is_production ? "2" : "1"
  memory_limit  = local.is_production ? "2Gi" : "1Gi"
  
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

        # Feature flags (removed PORT as it's reserved)
        dynamic "env" {
          for_each = local.current_features
          content {
            name  = env.key
            value = env.value
          }
        }
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}

# IAM policy for Cloud Run service (allow unauthenticated access)
resource "google_cloud_run_service_iam_member" "public_access" {
  service  = google_cloud_run_service.geargrab_app.name
  location = google_cloud_run_service.geargrab_app.location
  role     = "roles/run.invoker"
  member   = "allUsers"
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

# Outputs
output "service_url" {
  description = "URL of the Cloud Run service"
  value       = google_cloud_run_service.geargrab_app.status[0].url
}

output "service_name" {
  description = "Name of the Cloud Run service"
  value       = google_cloud_run_service.geargrab_app.name
}

output "feature_flags" {
  description = "Current feature flags for this environment"
  value       = local.current_features
}
