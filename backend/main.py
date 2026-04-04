import argparse
import os

import uvicorn
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models import User


def run_server():
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    reload_enabled = os.getenv("RELOAD", "false").lower() in {"1", "true", "yes"}
    uvicorn.run("app.main:app", host=host, port=port, reload=reload_enabled, log_level="info")


def create_admin(name: str, email: str, password: str) -> None:
    db: Session = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            raise SystemExit(f"User with email {email} already exists")

        user = User(
            name=name,
            email=email,
            password=get_password_hash(password),
            role="admin",
        )
        db.add(user)
        db.commit()
        print(f"Created admin user {email}")
    finally:
        db.close()


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Semantic Search backend utilities")
    subparsers = parser.add_subparsers(dest="command")

    serve_parser = subparsers.add_parser("serve", help="Run the FastAPI server")
    serve_parser.set_defaults(handler=lambda _args: run_server())

    create_admin_parser = subparsers.add_parser(
        "create-admin", help="Create an admin user explicitly"
    )
    create_admin_parser.add_argument("--name", required=True)
    create_admin_parser.add_argument("--email", required=True)
    create_admin_parser.add_argument("--password", required=True)
    create_admin_parser.set_defaults(
        handler=lambda args: create_admin(args.name, args.email, args.password)
    )

    return parser


def main():
    parser = build_parser()
    args = parser.parse_args()
    if args.command is None:
        run_server()
        return
    args.handler(args)


if __name__ == "__main__":
    main()
