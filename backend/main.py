import argparse
import os

import uvicorn
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models import User, Workspace


def run_server():
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    reload_enabled = os.getenv("RELOAD", "false").lower() in {"1", "true", "yes"}
    uvicorn.run("app.main:app", host=host, port=port, reload=reload_enabled, log_level="info")


def create_admin(name: str, email: str, password: str, workspace_name: str = "Default Workspace") -> None:
    db: Session = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            raise SystemExit(f"User with email {email} already exists")

        # Create or get default workspace
        workspace = db.query(Workspace).filter(Workspace.slug == "default").first()
        if not workspace:
            workspace = Workspace(
                name=workspace_name,
                slug="default"
            )
            db.add(workspace)
            db.flush()  # Get the workspace ID
            print(f"Created workspace: {workspace_name}")

        user = User(
            name=name,
            email=email,
            password=get_password_hash(password),
            role="admin",
            workspace_id=workspace.id,
        )
        db.add(user)
        db.commit()
        print(f"Created admin user {email} in workspace '{workspace.name}'")
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
    create_admin_parser.add_argument("--workspace", default="Default Workspace", help="Workspace name (default: Default Workspace)")
    create_admin_parser.set_defaults(
        handler=lambda args: create_admin(args.name, args.email, args.password, args.workspace)
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
