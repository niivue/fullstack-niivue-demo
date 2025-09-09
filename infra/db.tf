resource "aws_db_instance" "fullstack_niivue_db" {
  identifier             = "fullstack-niivue-db"
  allocated_storage      = 20
  max_allocated_storage  = 1000
  engine                 = "postgres"
  engine_version         = "17"
  instance_class         = "db.t4g.micro"
  db_name                = "fullstack_niivue"
  username               = local.db_username
  password               = local.db_password
  skip_final_snapshot    = true
  vpc_security_group_ids = [aws_security_group.fullstack_niivue_db.id]
  publicly_accessible    = false
}

resource "aws_security_group" "fullstack_niivue_db" {
  name        = "fullstack-niivue-db"
  description = "Allow inbound Postgres traffic"

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.fullstack_niivue_backend.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
