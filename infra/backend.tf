resource "aws_ecr_repository" "fullstack_niivue_backend" {
  name = "fullstack-niivue-backend"
}

resource "docker_image" "fullstack_niivue_backend" {
  name = "${aws_ecr_repository.fullstack_niivue_backend.repository_url}:latest"
  build {
    context    = "${path.root}/../backend"
    dockerfile = "Dockerfile"
    platform   = "linux/amd64"
  }
}


resource "docker_registry_image" "fullstack_niivue_backend" {
  name = docker_image.fullstack_niivue_backend.name
}

resource "aws_ecs_service" "fullstack_niivue_backend" {
  name            = "fullstack-niivue-backend"
  cluster         = aws_ecs_cluster.fullstack_niivue.id
  task_definition = aws_ecs_task_definition.fullstack_niivue_backend.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = data.aws_subnets.private.ids
    security_groups  = [aws_security_group.fullstack_niivue_backend.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.fullstack_niivue_backend.arn
    container_name   = "fullstack_niivue_backend"
    container_port   = 8000
  }
}

resource "aws_ecs_task_definition" "fullstack_niivue_backend" {
  family                   = "fullstack_niivue_backend"
  requires_compatibilities = ["FARGATE"]

  network_mode       = "awsvpc"
  cpu                = 1024
  memory             = 2048
  execution_role_arn = data.aws_iam_role.lab.arn
  task_role_arn      = data.aws_iam_role.lab.arn

  container_definitions = jsonencode([
    {
      image       = docker_image.fullstack_niivue_backend.name,
      cpu         = 512,
      memory      = 1024,
      name        = "fullstack_niivue_backend_prestart",
      networkMode = "awsvpc",
      essential   = false,
      command     = ["bash", "scripts/prestart.sh"],
      environment = local.backend_environment_vars,
      logConfiguration = {
        logDriver = "awslogs",
        options = {
          awslogs-group         = "/fullstack_niivue/backend-prestart",
          awslogs-region        = "us-east-1",
          awslogs-stream-prefix = "ecs",
          awslogs-create-group  = "true"
        }
      }
    },
    {
      image       = docker_image.fullstack_niivue_backend.name,
      cpu         = 512,
      memory      = 1024,
      name        = "fullstack_niivue_backend",
      networkMode = "awsvpc",
      portMappings = [
        {
          containerPort = 8000,
          hostPort      = 8000
        }
      ],
      dependsOn = [
        {
          containerName = "fullstack_niivue_backend_prestart",
          condition     = "SUCCESS"
        }
      ],
      environment = local.backend_environment_vars,
      logConfiguration = {
        logDriver = "awslogs",
        options = {
          awslogs-group         = "/fullstack_niivue/backend",
          awslogs-region        = "us-east-1",
          awslogs-stream-prefix = "ecs",
          awslogs-create-group  = "true"
        }
      }
    }
  ])
}

# Security Group
resource "aws_security_group" "fullstack_niivue_backend" {
  name        = "fullstack-niivue-backend"
  description = "Fullstack NiiVue API Security Group"

  ingress {
    from_port       = 8000
    to_port         = 8000
    protocol        = "tcp"
    security_groups = [aws_security_group.fullstack_niivue_lb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Scaling
resource "aws_appautoscaling_target" "fullstack_niivue_backend" {
  min_capacity       = 1
  max_capacity       = 3
  resource_id        = "service/${aws_ecs_cluster.fullstack_niivue.name}/${aws_ecs_service.fullstack_niivue_backend.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "fullstack_niivue_backend" {
  name               = "fullstack-niivue-backend"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.fullstack_niivue_backend.resource_id
  scalable_dimension = aws_appautoscaling_target.fullstack_niivue_backend.scalable_dimension
  service_namespace  = aws_appautoscaling_target.fullstack_niivue_backend.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }

    target_value = 50.0
  }
}

# Load Balancer
resource "aws_lb" "fullstack_niivue_backend" {
  name               = "fullstack-niivue-backend"
  internal           = false
  load_balancer_type = "application"
  subnets            = data.aws_subnets.private.ids
  security_groups    = [aws_security_group.fullstack_niivue_lb.id]
}

resource "aws_lb_target_group" "fullstack_niivue_backend" {
  name        = "fullstack-niivue-backend"
  port        = 8000
  protocol    = "HTTP"
  vpc_id      = aws_security_group.fullstack_niivue_backend.vpc_id
  target_type = "ip"

  health_check {
    path                = "/api/v1/utils/health-check"
    port                = "8000"
    protocol            = "HTTP"
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 10
  }
}


resource "aws_lb_listener" "fullstack_niivue_backend_http" {
  load_balancer_arn = aws_lb.fullstack_niivue_backend.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "forward"
    target_group_arn = aws_lb_target_group.fullstack_niivue_backend.arn
  }
}