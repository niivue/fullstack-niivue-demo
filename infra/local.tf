locals {
  # Database configuration
  db_username     = var.postgres_user
  db_password     = var.postgres_password
  db_name         = var.postgres_db
  db_port         = var.postgres_port
  
  # Application URLs - using ALB DNS names directly
  frontend_url = "https://${aws_lb.fullstack_niivue_frontend.dns_name}"
  backend_url  = "https://${aws_lb.fullstack_niivue_backend.dns_name}"
  
  # Application configuration
  project_name = var.project_name
  stack_name   = var.stack_name
  environment  = var.environment
  
  # Common environment variables for containers
  common_environment_vars = [
    {
      name  = "ENVIRONMENT"
      value = var.environment
    },
    {
      name  = "PROJECT_NAME"
      value = var.project_name
    },
    {
      name  = "SENTRY_DSN"
      value = var.sentry_dsn
    }
  ]
  
  # Backend-specific environment variables
  backend_environment_vars = concat(local.common_environment_vars, [
    {
      name  = "FRONTEND_HOST"
      value = local.frontend_url
    },
    {
      name  = "BACKEND_CORS_ORIGINS"
      value = var.backend_cors_origins
    },
    {
      name  = "POSTGRES_SERVER"
      value = aws_db_instance.fullstack_niivue_db.address
    },
    {
      name  = "POSTGRES_PORT"
      value = tostring(var.postgres_port)
    },
    {
      name  = "POSTGRES_DB"
      value = var.postgres_db
    },
    {
      name  = "POSTGRES_USER"
      value = var.postgres_user
    },
    {
      name  = "POSTGRES_PASSWORD"
      value = var.postgres_password
    },
    {
      name  = "WORKOS_API_KEY"
      value = var.workos_api_key
    },
    {
      name  = "WORKOS_CLIENT_ID"
      value = var.workos_client_id
    },
    {
      name  = "FIRST_SUPERUSER"
      value = var.first_superuser
    },
    {
      name  = "FIRST_SUPERUSER_PASSWORD"
      value = var.first_superuser_password
    }
  ])
  
  # Frontend-specific environment variables
  frontend_environment_vars = concat(local.common_environment_vars, [
    {
      name  = "VITE_API_URL"
      value = local.backend_url
    }
  ])
}