import re

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.user import User
from app.models.workspace import Workspace
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    RegisterWorkspaceRequest,
    Token,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    text = re.sub(r"^-+|-+$", "", text)
    return text


@router.post("/login", response_model=Token)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )

    token = create_access_token(subject=user.id)
    return Token(access_token=token)


@router.post("/register", response_model=Token, status_code=201)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    from datetime import datetime

    from app.models.invite_token import InviteToken

    # 1. Validate the invite token
    invite = (
        db.query(InviteToken)
        .filter(InviteToken.token == payload.invite_token)
        .first()
    )
    if not invite:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid invite token.",
        )
    if invite.used:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This invite link has already been used.",
        )
    if invite.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This invite link has expired.",
        )
    # 2. If the invite was locked to a specific email, enforce it
    if invite.email and invite.email.lower() != payload.email.lower():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This invite link is not valid for your email address.",
        )

    # 3. Check workspace user limit
    user_count = db.query(User).filter(User.workspace_id == invite.workspace_id).count()
    if user_count >= settings.max_users_per_workspace:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"This workspace has reached its user limit ({settings.max_users_per_workspace} users).",
        )

    # 4. Ensure the email isn't already taken
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email already in use."
        )

    # 5. Create the user in the workspace the invite belongs to
    user = User(
        name=payload.name,
        email=payload.email,
        password=get_password_hash(payload.password),
        role="user",
        workspace_id=invite.workspace_id,
    )
    db.add(user)

    # 6. Mark the invite token as consumed
    invite.used = True

    db.commit()
    db.refresh(user)

    token = create_access_token(subject=user.id)
    return Token(access_token=token)



@router.post("/register-workspace", response_model=Token, status_code=201)
def register_workspace(
    payload: RegisterWorkspaceRequest, db: Session = Depends(get_db)
):
    existing_user = db.query(User).filter(User.email == payload.admin_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email already in use"
        )

    base_slug = slugify(payload.workspace_name)
    slug = base_slug
    counter = 1
    while db.query(Workspace).filter(Workspace.slug == slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1

    workspace = Workspace(name=payload.workspace_name, slug=slug)
    db.add(workspace)
    db.commit()
    db.refresh(workspace)

    user = User(
        name=payload.admin_name,
        email=payload.admin_email,
        password=get_password_hash(payload.password),
        role="admin",
        workspace_id=workspace.id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(subject=user.id)
    return Token(access_token=token)
