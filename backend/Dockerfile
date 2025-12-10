FROM ubuntu:24.04

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1

WORKDIR /app/

# Install pixi
# Ref: https://pixi.sh/latest/installation/
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
RUN curl -fsSL https://pixi.sh/install.sh | bash

# Place executables in the environment at the front of the path
# Ref: https://docs.astral.sh/uv/guides/integration/docker/#using-the-environment
ENV PATH="/root/.pixi/bin:$PATH"

# Install dependencies
# Copy files needed for dependency installation first
COPY ./pixi.toml ./pixi.lock ./alembic.ini /app/

# Install dependencies using pixi
RUN pixi install

# Set up environment to use pixi
# ENV PATH="/app/.pixi/envs/default/bin:$PATH"

# ENV PYTHONPATH=/app/.pixi

COPY ./scripts /app/scripts

COPY ./app /app/app

# Set environment variables for production
ENV NIIVUE_BUILD_DIR="/app/static"
ENV DATA_DIR="/app/data" 
ENV SCENE_SCHEMA_ID="niivue-fullstack-demo"
ENV PYTHONPATH="/app"

EXPOSE 8000

# Use the serve task for production
CMD ["pixi", "run", "serve"]