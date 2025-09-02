locals {
  db_username = "administrator"
  frontend_url      = "https://${aws_route53_record.fullstack_niivue_frontend.name}"
  backend_url     = "https://${aws_route53_record.fullstack_niivue_backend.name}"
}