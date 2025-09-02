data "aws_route53_zone" "fullstack_niivue" {
  name         = "g3.niivue.xyz"
  private_zone = false
}

resource "aws_route53_record" "fullstack_niivue_frontend" {
  zone_id = data.aws_route53_zone.fullstack_niivue.zone_id
  name    = "fullstack_niivue.g3.niivue.xyz"
  type    = "A"
  alias {
    name                   = "dualstack.${aws_lb.fullstack_niivue_frontend.dns_name}"
    zone_id                = aws_lb.fullstack_niivue_frontend.zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "fullstack_niivue_backend" {
  zone_id = data.aws_route53_zone.fullstack_niivue.zone_id
  name    = "fullstack_niivue_backend.g3.niivue.xyz"
  type    = "A"
  alias {
    name                   = "dualstack.${aws_lb.fullstack_niivue_backend.dns_name}"
    zone_id                = aws_lb.fullstack_niivue_backend.zone_id
    evaluate_target_health = true
  }
}

data "aws_acm_certificate" "fullstack_niivue" {
  domain = "*.g3.niivue.xyz"
}