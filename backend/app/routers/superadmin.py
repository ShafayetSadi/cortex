from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, defer

from app.core.database import get_db
from app.core.security import get_password_hash
from app.deps import require_superadmin
from app.models.document import Document
from app.models.user import User
from app.models.workspace import Workspace
from app.schemas.document import DocumentOut
from app.schemas.user import SuperAdminUserOut, UserUpdate, WorkspaceStats

router = APIRouter(prefix="/api/superadmin", tags=["superadmin"])


# ---------------------------------------------------------------------------
# Workspaces
# ---------------------------------------------------------------------------

@router.get("/workspaces", response_model=list[WorkspaceStats])
def list_workspaces(
    _: User = Depends(require_superadmin),
    db: Session = Depends(get_db),
):
    workspaces = db.query(Workspace).order_by(Workspace.created_at.desc()).all()
    result = []
    for ws in workspaces:
        user_count = db.query(User).filter(User.workspace_id == ws.id).count()
        doc_count = db.query(Document).filter(Document.workspace_id == ws.id).count()
        result.append(WorkspaceStats(
            id=ws.id,
            name=ws.name,
            slug=ws.slug,
            created_at=ws.created_at,
            user_count=user_count,
            document_count=doc_count,
        ))
    return result


@router.delete("/workspaces/{workspace_id}", status_code=204)
def delete_workspace(
    workspace_id: int,
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db),
):
    if current_user.workspace_id == workspace_id:
        raise HTTPException(status_code=400, detail="Cannot delete the system workspace.")
    ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found.")
    db.delete(ws)
    db.commit()


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------

@router.get("/users", response_model=list[SuperAdminUserOut])
def list_all_users(
    _: User = Depends(require_superadmin),
    db: Session = Depends(get_db),
):
    users = db.query(User).order_by(User.created_at.desc()).all()
    result = []
    for u in users:
        result.append(SuperAdminUserOut(
            id=u.id,
            name=u.name,
            email=u.email,
            role=u.role,
            workspace_id=u.workspace_id,
            workspace_name=u.workspace.name if u.workspace else "—",
            created_at=u.created_at,
        ))
    return result


@router.put("/users/{user_id}", response_model=SuperAdminUserOut)
def update_user(
    user_id: int,
    payload: UserUpdate,
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db),
):
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot edit your own account here.")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    updates = payload.model_dump(exclude_unset=True)
    if updates.get("role") == "superadmin":
        raise HTTPException(status_code=403, detail="Cannot assign superadmin role")
    if "password" in updates:
        updates["password"] = get_password_hash(updates["password"])
    for field, value in updates.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return SuperAdminUserOut(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        workspace_id=user.workspace_id,
        workspace_name=user.workspace.name if user.workspace else "—",
        created_at=user.created_at,
    )


@router.delete("/users/{user_id}", status_code=204)
def delete_user(
    user_id: int,
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db),
):
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account.")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    db.delete(user)
    db.commit()


# ---------------------------------------------------------------------------
# Documents
# ---------------------------------------------------------------------------

@router.get("/documents", response_model=list[DocumentOut])
def list_all_documents(
    _: User = Depends(require_superadmin),
    db: Session = Depends(get_db),
):
    docs = (
        db.query(Document)
        .options(defer(Document.file_data))
        .order_by(Document.created_at.desc())
        .all()
    )
    from app.routers.documents import serialize_document
    return [serialize_document(doc) for doc in docs]


@router.delete("/documents/{document_id}", status_code=204)
def delete_document(
    document_id: int,
    _: User = Depends(require_superadmin),
    db: Session = Depends(get_db),
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    db.delete(doc)
    db.commit()
