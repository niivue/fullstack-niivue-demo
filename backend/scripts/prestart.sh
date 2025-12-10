#! /usr/bin/env bash

set -e
set -x

# Let the DB start
pixi run python app/backend_pre_start.py

# Run migrations
pixi run alembic upgrade head

# Create initial data in DB
pixi run python app/initial_data.py
