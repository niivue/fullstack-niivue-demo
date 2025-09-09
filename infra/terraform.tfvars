# Domain and Environment
domain       = "localhost"  # Set to your production domain
environment  = "production"  # or "staging"
project_name = "Full Stack NiiVue"
stack_name   = "full-stack-niivue"

# Backend Configuration
backend_cors_origins = "http://localhost,http://localhost:5173,https://localhost,https://localhost:5173,http://localhost.tiangolo.com"
first_superuser      = "user@test.com"
# first_superuser_password will be set via TF_VAR_first_superuser_password environment variable

# Database Configuration
postgres_server = "localhost"  # This will be overridden by AWS RDS endpoint
postgres_port   = 5432
postgres_db     = "app"
postgres_user   = "postgres"
# postgres_password will be set via TF_VAR_postgres_password environment variable

# External Services
# sentry_dsn will be set via TF_VAR_sentry_dsn environment variable
# workos_api_key will be set via TF_VAR_workos_api_key environment variable  
# workos_client_id will be set via TF_VAR_workos_client_id environment variable

# Docker Images
docker_image_backend  = "backend"
docker_image_frontend = "frontend"
