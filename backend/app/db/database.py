from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session
from app.core.config import settings


class Base(DeclarativeBase):
    """Modern SQLAlchemy 2.0 Base class"""
    pass


# Build database engine
# If running SQLite (e.g. in test), disable check_same_thread
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a SQLAlchemy database session with automatic cleanup."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
