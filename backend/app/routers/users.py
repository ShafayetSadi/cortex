from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_password_hash
from app.deps import get_current_user, require_admin
from app.models.document import Document
from app.models.user import User
from app.schemas.user import UserCreate, UserOut, UserUpdate, UsageOut

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/me/usage", response_model=UsageOut)
def get_my_usage(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    today = datetime.utcnow().date()
    queries_used = (
        current_user.queries_today
        if current_user.queries_reset_at and current_user.queries_reset_at.date() == today
        else 0
    )
    doc_count = db.query(Document).filter(Document.workspace_id == current_user.workspace_id).count()
    workspace_users = db.query(User).filter(User.workspace_id == current_user.workspace_id).count()
    return UsageOut(
        queries_used_today=queries_used,
        queries_limit=settings.max_queries_per_day,
        documents_uploaded=doc_count,
        documents_limit=settings.max_documents_per_workspace,
        file_size_limit_mb=settings.max_file_size_mb,
        max_query_length=settings.max_query_length,
        workspace_users=workspace_users,
        workspace_users_limit=settings.max_users_per_workspace,
    )


@router.get("/", response_model=list[UserOut], dependencies=[Depends(require_admin)])
def list_users(
    current_user: User = Depends(require_admin), db: Session = Depends(get_db)
):
    return (
        db.query(User)
        .filter(User.workspace_id == current_user.workspace_id)
        .order_by(User.created_at.desc())
        .all()
    )


@router.post("/", response_model=UserOut, status_code=201)
def create_user(
    payload: UserCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email already in use"
        )

    new_user = User(
        name=payload.name,
        email=payload.email,
        password=get_password_hash(payload.password),
        role=payload.role,
        workspace_id=current_user.workspace_id,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.put("/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    payload: UserUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.id == user_id, User.workspace_id == current_user.workspace_id)
        .first()
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    updates = payload.model_dump(exclude_unset=True)
    if "password" in updates:
        updates["password"] = get_password_hash(updates["password"])

    for field, value in updates.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=204)
def delete_user(
    user_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    user = (
        db.query(User)
        .filter(User.id == user_id, User.workspace_id == current_user.workspace_id)
        .first()
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
