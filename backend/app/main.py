from contextlib import asynccontextmanager

from alembic.config import Config
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from alembic import command
from app.core.config import settings
from app.core.database import get_db
from app.routers import auth, collections, documents, superadmin, users, workspaces


def run_migrations() -> None:
    alembic_cfg = Config("alembic.ini")
    command.upgrade(alembic_cfg, "head")


def seed_superadmin() -> None:
    from datetime import datetime

    from app.core.database import SessionLocal
    from app.core.security import get_password_hash
    from app.models.user import User
    from app.models.workspace import Workspace

    if not (settings.superadmin_name and settings.superadmin_email and settings.superadmin_password):
        return

    db = SessionLocal()
    try:
        if db.query(User).filter(User.role == "superadmin").first():
            return  # already exists

        if db.query(User).filter(User.email == settings.superadmin_email).first():
            print(f"[seed] Skipping superadmin: email {settings.superadmin_email} already in use")
            return

        system_ws = db.query(Workspace).filter(Workspace.slug == "system").first()
        if not system_ws:
            system_ws = Workspace(name="System", slug="system",
                                  created_at=datetime.utcnow(), updated_at=datetime.utcnow())
            db.add(system_ws)
            db.flush()

        db.add(User(
            name=settings.superadmin_name,
            email=settings.superadmin_email,
            password=get_password_hash(settings.superadmin_password),
            role="superadmin",
            workspace_id=system_ws.id,
        ))
        db.commit()
        print(f"[seed] Superadmin created: {settings.superadmin_email}")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    run_migrations()
    seed_superadmin()
    yield


app = FastAPI(title="Cortex API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.parsed_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(documents.router)
app.include_router(documents.public_router)
app.include_router(workspaces.router)
app.include_router(collections.router)
app.include_router(superadmin.router)


@app.get("/")
def root():
    return {"message": "Cortex API is running"}


@app.get("/health")
@app.head("/health")
def health(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        db_status = "ok"
    except Exception:
        db_status = "unavailable"

    return {
        "status": "ok" if db_status == "ok" else "degraded",
        "database": db_status,
    }
