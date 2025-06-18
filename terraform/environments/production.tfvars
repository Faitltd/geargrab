# Production Environment Configuration
environment = "production"
project_id  = "geargrabco"
region      = "us-central1"

# Service configuration
service_name = "geargrab-app"
domain_name  = "geargrab.co"

# Resource limits for production
min_instances = 1
max_instances = 20
cpu_limit     = "2"
memory_limit  = "2Gi"
