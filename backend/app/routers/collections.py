from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.deps import get_current_user
from app.models.collection import Collection
from app.models.document import Document
from app.models.user import User
from app.schemas.collection import CollectionCreate, CollectionOut, CollectionUpdate

router = APIRouter(prefix="/api/collections", tags=["collections"])


def serialize_collection(col: Collection, doc_count: int) -> CollectionOut:
    return CollectionOut(
        id=col.id,
        name=col.name,
        description=col.description,
        workspace_id=col.workspace_id,
        created_by=col.created_by,
        created_at=col.created_at,
        updated_at=col.updated_at,
        document_count=doc_count,
    )


def get_collection_or_404(
    collection_id: int, current_user: User, db: Session
) -> Collection:
    col = (
        db.query(Collection)
        .filter(
            Collection.id == collection_id,
            Collection.workspace_id == current_user.workspace_id,
        )
        .first()
    )
    if not col:
        raise HTTPException(status_code=404, detail="Collection not found")
    return col


def _list_collections_with_counts(workspace_id: int, db: Session) -> list[CollectionOut]:
    rows = (
        db.query(Collection, func.count(Document.id).label("doc_count"))
        .outerjoin(Document, Document.collection_id == Collection.id)
        .filter(Collection.workspace_id == workspace_id)
        .group_by(Collection.id)
        .order_by(Collection.name)
        .all()
    )
    return [serialize_collection(col, doc_count) for col, doc_count in rows]


@router.get("/", response_model=list[CollectionOut])
def list_collections(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    return _list_collections_with_counts(current_user.workspace_id, db)


@router.post("/", response_model=CollectionOut, status_code=201)
def create_collection(
    body: CollectionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    col = Collection(
        name=body.name,
        description=body.description,
        workspace_id=current_user.workspace_id,
        created_by=current_user.id,
    )
    db.add(col)
    db.commit()
    db.refresh(col)
    return serialize_collection(col, 0)


@router.put("/{collection_id}", response_model=CollectionOut)
def update_collection(
    collection_id: int,
    body: CollectionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    col = get_collection_or_404(collection_id, current_user, db)
    if current_user.role not in ("admin", "superadmin") and col.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    if body.name is not None:
        col.name = body.name
    if body.description is not None:
        col.description = body.description

    db.commit()
    doc_count = db.query(func.count(Document.id)).filter(Document.collection_id == col.id).scalar()
    return serialize_collection(col, doc_count)


@router.delete("/{collection_id}", status_code=204)
def delete_collection(
    collection_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    col = get_collection_or_404(collection_id, current_user, db)
    if current_user.role not in ("admin", "superadmin") and col.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Unassign documents rather than deleting them
    db.query(Document).filter(Document.collection_id == col.id).update(
        {Document.collection_id: None}
    )
    db.delete(col)
    db.commit()


@router.patch("/{collection_id}/documents/{document_id}", status_code=204)
def add_document_to_collection(
    collection_id: int,
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    get_collection_or_404(collection_id, current_user, db)

    doc = (
        db.query(Document)
        .filter(
            Document.id == document_id,
            Document.workspace_id == current_user.workspace_id,
        )
        .first()
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if current_user.role != "admin" and doc.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    doc.collection_id = collection_id
    db.commit()


@router.delete("/{collection_id}/documents/{document_id}", status_code=204)
def remove_document_from_collection(
    collection_id: int,
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    get_collection_or_404(collection_id, current_user, db)

    doc = (
        db.query(Document)
        .filter(
            Document.id == document_id,
            Document.workspace_id == current_user.workspace_id,
            Document.collection_id == collection_id,
        )
        .first()
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found in this collection")
    if current_user.role != "admin" and doc.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    doc.collection_id = None
    db.commit()
