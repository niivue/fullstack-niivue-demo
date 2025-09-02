resource "aws_ecr_repository" "fullstack_niivue_frontend" {
  name = "fullstack_niivue_frontend"
}

resource "docker_image" "fullstack_niivue_frontend" {
  name = "${aws_ecr_repository.fullstack_niivue_frontend.repository_url}:latest"
  build {
    dockerfile = "Dockerfile"
    context    = "${path.root}/../frontend"
    platform   = "linux/amd64"
  }
}

resource "docker_registry_image" "fullstack_niivue_frontend" {
  name = docker_image.fullstack_niivue_frontend.name
}

resource "aws_ecs_service" "fullstack_niivue_frontend" {
  name            = "fullstack_niivue_frontend"
  cluster         = aws_ecs_cluster.fullstack_niivue.id
  task_definition = aws_ecs_task_definition.fullstack_niivue_frontend.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = data.aws_subnets.private.ids
    security_groups  = [aws_security_group.fullstack_niivue_frontend.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.fullstack_niivue_frontend.arn
    container_name   = "fullstack_niivue_frontend"
    container_port   = 3000
  }
}

resource "aws_ecs_task_definition" "fullstack_niivue_frontend" {
  family                   = "fullstack_niivue_frontend"
  requires_compatibilities = ["FARGATE"]

  network_mode       = "awsvpc"
  cpu                = 1024
  memory             = 2048
  execution_role_arn = data.aws_iam_role.lab.arn
  task_role_arn      = data.aws_iam_role.lab.arn

  container_definitions = jsonencode([
    {
      image       = "${docker_image.fullstack_niivue_frontend.name}",
      cpu         = 1024,
      memory      = 2048,
      name        = "fullstack_niivue_frontend",
      networkMode = "awsvpc",
      portMappings = [
        {
          containerPort = 3000,
          hostPort      = 3000
        }
      ],
      environment = [
        {
          name  = "BACKEND_BASE_URL",
          value = local.backend_url
        },
        {
          name  = "WORKOS_API_KEY",
          value = var.workos_api_key
        },
        {
          name  = "WORKOS_CLIENT_ID",
          value = var.workos_client_id
        },
      ],
      logConfiguration = {
        logDriver = "awslogs",
        options = {
          awslogs-group         = "/fullstack_niivue/frontend",
          awslogs-region        = "us-east-1",
          awslogs-stream-prefix = "ecs",
          awslogs-create-group  = "true"
        }
      }
    }
  ])
}


# Security Group
resource "aws_security_group" "fullstack_niivue_frontend" {
  name        = "fullstack_niivue_frontend"
  description = "Expenseflow UI Security Group"

  ingress {
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.fullstack_niivue_alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}


# Load Balancer
resource "aws_lb" "fullstack_niivue_frontend" {
  name               = "fullstack_niivue_frontend"
  internal           = false
  load_balancer_type = "application"
  subnets            = data.aws_subnets.private.ids
  security_groups    = [aws_security_group.fullstack_niivue_alb.id]
}

resource "aws_lb_target_group" "fullstack_niivue_frontend" {
  name        = "fullstack_niivue_frontend"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = aws_security_group.fullstack_niivue_frontend.vpc_id
  target_type = "ip"

  health_check {
    path                = "/health"
    port                = "3000"
    protocol            = "HTTP"
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 10
  }
}

resource "aws_lb_listener" "fullstack_niivue_frontend_https" {
  load_balancer_arn = aws_lb.fullstack_niivue_frontend.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-2016-08"
  certificate_arn   = data.aws_acm_certificate.fullstack_niivue.arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.fullstack_niivue_frontend.arn
  }
}

resource "aws_lb_listener" "fullstack_niivue_frontend_http" {
  load_balancer_arn = aws_lb.fullstack_niivue_frontend.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "redirect"
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}