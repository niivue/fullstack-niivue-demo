resource "aws_db_instance" "fullstack_niivue_db" {
  identifier             = "fullstack_niivue_db"
  allocated_storage      = 20
  max_allocated_storage  = 1000
  engine                 = "postgres"
  engine_version         = "17"
  instance_class         = "db.t4g.micro"
  db_name                = "fullstack_niivue"
  username               = local.db_username
  password               = var.db_password
  skip_final_snapshot    = true
  vpc_security_group_ids = [aws_security_group.fullstack_niivue_db.id]
  publicly_accessible    = false
}

resource "aws_security_group" "fullstack_niivue_db" {
  name        = "fullstack_niivue_db"
  description = "Allow inbound Postgres traffic"

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.fullstack_niivue_api.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_secretsmanager_secret" "db_secret" {
  name = "db-secret"

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_secretsmanager_secret_version" "db_secret" {
  secret_id     = aws_secretsmanager_secret.db_secret.id
  secret_string = var.db_password
}