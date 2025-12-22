from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# SQLite-Datei im Projektordner
SQLALCHEMY_DATABASE_URL = "sqlite:///./cura.db"

# connect_args ist bei SQLite nötig
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


# Dependency für FastAPI: DB-Session holen und wieder schließen
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

