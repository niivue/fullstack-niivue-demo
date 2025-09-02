variable "db_password" {
  description = "Password for the database"
}

variable "auth0_domain" {
  description = "Auth0 Domain"
}

variable "workos_client_id" {
  description = "Auth0 M2M Application Client ID"
}

variable "workos_api_key" {
  description = "WorkOS API Key"
}

variable "sentry_dsn" {
  description = "Data source name for sentry plugin"
}