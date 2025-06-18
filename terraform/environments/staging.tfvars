# Staging Environment Configuration
environment = "staging"
project_id  = "geargrabco-staging"
region      = "us-central1"

# Service configuration
service_name = "geargrab-app"
domain_name  = ""  # No custom domain for staging

# Resource limits for staging
min_instances = 0
max_instances = 5
cpu_limit     = "1"
memory_limit  = "1Gi"
