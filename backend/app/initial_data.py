from sqlmodel import Session

from app.core.db import engine, init_db


def init() -> None:
    with Session(engine) as session:
        init_db(session)


def main() -> None:
    print("Creating initial data")
    init()
    print("Initial data created")


if __name__ == "__main__":
    main()
