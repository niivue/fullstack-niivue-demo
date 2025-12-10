variable "domain" {
  description = "Domain for the application"
  type        = string
  default     = "localhost"
}

variable "environment" {
  description = "Environment: local, staging, production"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "Full Stack NiiVue"
}

variable "stack_name" {
  description = "Name of the stack"
  type        = string
  default     = "full-stack-niivue"
}

# Backend variables
variable "backend_cors_origins" {
  description = "CORS origins for the backend"
  type        = string
  default     = "http://localhost,http://localhost:5173,https://localhost,https://localhost:5173"
}

variable "first_superuser" {
  description = "Email for the first superuser"
  type        = string
  default     = "user@test.com"
}

variable "first_superuser_password" {
  description = "Password for the first superuser"
  type        = string
  default     = "testuserpassword"
}

# Database variables
variable "postgres_server" {
  description = "PostgreSQL server hostname"
  type        = string
  default     = "localhost"
}

variable "postgres_port" {
  description = "PostgreSQL server port"
  type        = number
  default     = 5432
}

variable "postgres_db" {
  description = "PostgreSQL database name"
  type        = string
  default     = "app"
}

variable "postgres_user" {
  description = "PostgreSQL username"
  type        = string
  default     = "postgres"
}

variable "postgres_password" {
  description = "PostgreSQL password"
  type        = string
  sensitive   = true
}

# External service variables
variable "sentry_dsn" {
  description = "Data source name for sentry plugin"
  type        = string
  default     = ""
}

variable "workos_api_key" {
  description = "WorkOS API Key"
  type        = string
  sensitive   = true
}

variable "workos_client_id" {
  description = "WorkOS Client ID"
  type        = string
  sensitive   = true
}

# Docker images
variable "docker_image_backend" {
  description = "Docker image for backend"
  type        = string
  default     = "backend"
}

variable "docker_image_frontend" {
  description = "Docker image for frontend"
  type        = string
  default     = "frontend"
}