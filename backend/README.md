# FastAPI Project - Backend

## Requirements

* [pixi](https://pixi.sh/latest/installation/) for Python package and environment management.


## General Workflow

By default, the dependencies are managed with [pixi](https://pixi.sh/latest/installation/), go there and install it.

From `./backend/` you can install all the dependencies with:

```console
$ pixi install
```

Then you can activate the virtual environment with:

```console
$ pixi shell
```

Make sure your editor is using the correct Python virtual environment, with the interpreter at `backend/.pixi/envs/default/bin/python`.

Modify or add SQLModel models for data and SQL tables in `./backend/app/models.py`, API endpoints in `./backend/app/api/`, CRUD (Create, Read, Update, Delete) utils in `./backend/app/crud.py`.

## Migrations

You should run the migrations with `alembic` commands and the migration code will be in your app directory. Make sure you create a "revision" of your models and that you "upgrade" your database with that revision every time you change them. As this is what will update the tables in your database. Otherwise, your application will have errors.

* Start the app by running

```console
docker compose watch
```

* Activate the environment from backend directory

```console
$ pixi shell
```

* Alembic is already configured to import your SQLModel models from `./backend/app/models.py`.

* After changing a model (for example, adding a column), create a revision, e.g.:

```console
$ alembic revision --autogenerate -m "Add column last_name to Scene model"
```

* Commit to the git repository the files generated in the alembic directory.

* After creating the revision, run the migration in the database (this is what will actually change the database):

```console
$ alembic upgrade head
```
## Static File Serving

The backend now serves uploaded files at `/static/uploads/` using FastAPI's StaticFiles.

Files are stored in `/tmp/uploads/` and accessible via the static file endpoint.