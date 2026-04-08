import secrets
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.deps import get_current_user, require_admin
from app.models.invite_token import InviteToken
from app.models.user import User
from app.models.workspace import Workspace
from app.schemas.user import UserOut
from app.schemas.workspace import InviteCreate, InviteOut, WorkspaceOut, WorkspaceUpdate

router = APIRouter(prefix="/api/workspaces", tags=["workspaces"])


@router.get("/me", response_model=WorkspaceOut)
def get_my_workspace(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    workspace = (
        db.query(Workspace).filter(Workspace.id == current_user.workspace_id).first()
    )
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found"
        )
    return workspace


@router.put("/me", response_model=WorkspaceOut)
def update_my_workspace(
    payload: WorkspaceUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    workspace = (
        db.query(Workspace).filter(Workspace.id == current_user.workspace_id).first()
    )
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found"
        )

    if payload.name is not None:
        workspace.name = payload.name
    if payload.slug is not None:
        # Check slug uniqueness
        existing = (
            db.query(Workspace)
            .filter(Workspace.slug == payload.slug, Workspace.id != workspace.id)
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Slug already in use"
            )
        workspace.slug = payload.slug

    db.commit()
    db.refresh(workspace)
    return workspace


@router.post("/me/invite", response_model=InviteOut, status_code=201)
def create_invite(
    payload: InviteCreate,
    request: Request,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Generate a one-time invite link for the current workspace (admin only).

    The returned ``invite_url`` points to the frontend registration page with
    the token pre-filled as a query parameter, e.g.
    ``https://your-app.com/register?invite=<token>``.
    """
    token = secrets.token_urlsafe(40)
    expires_at = datetime.utcnow() + timedelta(hours=48)

    invite = InviteToken(
        token=token,
        workspace_id=current_user.workspace_id,
        email=payload.email.lower() if payload.email else None,
        expires_at=expires_at,
    )
    db.add(invite)
    db.commit()
    db.refresh(invite)

    # Build the invite URL from the incoming request's base URL so it works
    # in any environment (local, staging, production).
    base_url = str(request.base_url).rstrip("/")
    invite_url = f"{base_url}/register?invite={token}"

    return InviteOut(
        invite_url=invite_url,
        token=token,
        expires_at=expires_at,
        email=invite.email,
    )


# ---------------------------------------------------------------------------
# Member management
# ---------------------------------------------------------------------------


@router.get("/me/members", response_model=list[UserOut])
def list_members(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Return all users that belong to the current admin's workspace."""
    return (
        db.query(User)
        .filter(User.workspace_id == current_user.workspace_id)
        .order_by(User.created_at.asc())
        .all()
    )


@router.delete("/me/members/{user_id}", status_code=204)
def remove_member(
    user_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Remove a member from the workspace (admin only).

    The user record is deleted entirely — they will need a new invite to rejoin.
    An admin cannot remove themselves.
    """
    if current_user.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot remove yourself from the workspace.",
        )

    member = (
        db.query(User)
        .filter(
            User.id == user_id,
            User.workspace_id == current_user.workspace_id,
        )
        .first()
    )
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found in this workspace.",
        )

    db.delete(member)
    db.commit()


# ---------------------------------------------------------------------------
# Workspace self-destruct
# ---------------------------------------------------------------------------


@router.delete("/me", status_code=204)
def delete_workspace(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Permanently delete the current workspace and ALL of its data.

    Cascades to: invite_tokens, document_chunks, documents, users, workspace.
    This action is irreversible.
    """
    workspace = (
        db.query(Workspace)
        .filter(Workspace.id == current_user.workspace_id)
        .first()
    )
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found.",
        )

    # SQLAlchemy cascade="all, delete-orphan" on Workspace relationships
    # handles the cascade automatically when the workspace row is deleted.
    db.delete(workspace)
    db.commit()
