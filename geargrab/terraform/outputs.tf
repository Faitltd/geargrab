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

output "domain_mapping_status" {
  description = "Status of domain mappings"
  value = var.domain_name != "" ? {
    main_domain = "Domain mapping created for ${var.domain_name}"
  } : null
}
