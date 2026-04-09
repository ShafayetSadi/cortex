from datetime import datetime
from math import sqrt

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import Response
from sqlalchemy.orm import Session, defer, joinedload

from app.core.chunking import chunk_text
from app.core.config import settings
from app.core.database import get_db
from app.core.embeddings import EmbeddingError, generate_embedding
from app.core.pdf import PDFExtractionError, extract_text_from_pdf
from app.core.rag import RAGError, answer_question
from app.deps import get_current_user
from app.models.chunk import DocumentChunk
from app.models.document import Document
from app.models.user import User
from app.schemas.document import (
    AskRequest,
    AskResponse,
    AskSource,
    DocumentOut,
    PublicDocumentOut,
)

router = APIRouter(prefix="/api/documents", tags=["documents"])
# Public router was formerly for unauthenticated, but RAG requires workspace scoping.
# We will require authentication for these as per the workspace plan.
public_router = APIRouter(prefix="/api/public", tags=["public"])


def cosine_similarity(left: list[float], right: list[float]) -> float:
    if len(left) != len(right) or not left:
        return 0.0
    dot_product = sum(a * b for a, b in zip(left, right))
    left_norm = sqrt(sum(v * v for v in left))
    right_norm = sqrt(sum(v * v for v in right))
    if not left_norm or not right_norm:
        return 0.0
    return dot_product / (left_norm * right_norm)


def try_generate_embedding(text: str) -> list[float] | None:
    try:
        return generate_embedding(text)
    except EmbeddingError:
        return None


def create_chunks(doc: Document, content: str, db: Session) -> None:
    for i, chunk_content in enumerate(chunk_text(content)):
        db.add(
            DocumentChunk(
                document_id=doc.id,
                workspace_id=doc.workspace_id,
                chunk_index=i,
                content=chunk_content,
                embedding=try_generate_embedding(chunk_content),
            )
        )


def serialize_document(doc: Document) -> DocumentOut:
    return DocumentOut(
        id=doc.id,
        title=doc.title,
        description=doc.description,
        created_by=doc.created_by,
        created_at=doc.created_at,
        updated_at=doc.updated_at,
    )


def serialize_public_document(doc: Document) -> PublicDocumentOut:
    return PublicDocumentOut(
        id=doc.id,
        title=doc.title,
        description=doc.description,
        created_at=doc.created_at,
        author_id=doc.creator.id,
        author_name=doc.creator.name,
    )


# --- Authenticated document management ---


@router.get("/", response_model=list[DocumentOut])
def list_documents(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    query = (
        db.query(Document)
        .options(defer(Document.file_data))
        .filter(Document.workspace_id == current_user.workspace_id)
    )
    if current_user.role != "admin":
        query = query.filter(Document.created_by == current_user.id)
    return [
        serialize_document(doc)
        for doc in query.order_by(Document.created_at.desc()).all()
    ]


@router.post("/", response_model=DocumentOut, status_code=201)
async def create_document(
    title: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    doc_count = db.query(Document).filter(Document.workspace_id == current_user.workspace_id).count()
    if doc_count >= settings.max_documents_per_workspace:
        raise HTTPException(
            status_code=429,
            detail=f"Document limit reached ({settings.max_documents_per_workspace} files per workspace). Delete a document to upload more.",
        )

    file_bytes = await file.read()
    if len(file_bytes) > settings.max_file_size_mb * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds the {settings.max_file_size_mb}MB size limit.",
        )
    try:
        content = extract_text_from_pdf(file_bytes)
    except PDFExtractionError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    doc = Document(
        title=title,
        description=content,
        file_data=file_bytes,
        created_by=current_user.id,
        workspace_id=current_user.workspace_id,
    )
    db.add(doc)
    db.flush()  # populate doc.id before creating chunks
    create_chunks(doc, content, db)
    db.commit()
    db.refresh(doc)
    return serialize_document(doc)


@router.put("/{document_id}", response_model=DocumentOut)
async def update_document(
    document_id: int,
    title: str | None = Form(default=None),
    file: UploadFile | None = File(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = (
        db.query(Document)
        .options(defer(Document.file_data))
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

    if title:
        doc.title = title

    if file:
        if not file.filename or not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Only PDF files are supported")
        file_bytes = await file.read()
        try:
            content = extract_text_from_pdf(file_bytes)
        except PDFExtractionError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc
        doc.description = content
        doc.file_data = file_bytes
        db.query(DocumentChunk).filter(DocumentChunk.document_id == doc.id).delete()
        create_chunks(doc, content, db)

    db.commit()
    db.refresh(doc)
    return serialize_document(doc)


@router.delete("/{document_id}", status_code=204)
def delete_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = (
        db.query(Document)
        .options(defer(Document.file_data))
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
    db.delete(doc)
    db.commit()


# --- Scoped RAG & Fetch endpoints ---


@public_router.get("/documents/", response_model=list[PublicDocumentOut])
def list_public_documents(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    docs = (
        db.query(Document)
        .options(defer(Document.file_data))
        .join(Document.creator)
        .filter(Document.workspace_id == current_user.workspace_id)
        .order_by(Document.created_at.desc())
        .all()
    )
    return [serialize_public_document(doc) for doc in docs]


@public_router.get("/documents/{document_id}", response_model=PublicDocumentOut)
def get_public_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = (
        db.query(Document)
        .options(defer(Document.file_data))
        .join(Document.creator)
        .filter(
            Document.id == document_id,
            Document.workspace_id == current_user.workspace_id,
        )
        .first()
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return serialize_public_document(doc)


@public_router.get("/documents/{document_id}/file")
def get_document_file(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = (
        db.query(Document)
        .filter(
            Document.id == document_id,
            Document.workspace_id == current_user.workspace_id,
        )
        .first()
    )
    if not doc or not doc.file_data:
        raise HTTPException(status_code=404, detail="File not found")
    return Response(
        content=doc.file_data,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{doc.title}.pdf"'},
    )


@public_router.post("/ask", response_model=AskResponse)
def ask(
    request: AskRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    if len(request.question) > settings.max_query_length:
        raise HTTPException(
            status_code=400,
            detail=f"Question exceeds the {settings.max_query_length} character limit.",
        )

    now = datetime.utcnow()
    if not current_user.queries_reset_at or current_user.queries_reset_at.date() < now.date():
        current_user.queries_today = 0
        current_user.queries_reset_at = now

    if current_user.queries_today >= settings.max_queries_per_day:
        raise HTTPException(
            status_code=429,
            detail=f"Daily query limit reached ({settings.max_queries_per_day} queries). Try again tomorrow.",
        )

    current_user.queries_today += 1
    db.add(current_user)
    db.commit()

    question_embedding = try_generate_embedding(request.question)
    if question_embedding is None:
        raise HTTPException(status_code=503, detail="Unable to process question")

    chunks = (
        db.query(DocumentChunk)
        .options(joinedload(DocumentChunk.document))
        .filter(DocumentChunk.workspace_id == current_user.workspace_id)
        .filter(DocumentChunk.embedding.isnot(None))
        .all()
    )

    scored = [
        (chunk, cosine_similarity(question_embedding, chunk.embedding))
        for chunk in chunks
        if chunk.embedding is not None
    ]
    scored = [(chunk, score) for chunk, score in scored if score >= request.threshold]
    scored.sort(key=lambda x: x[1], reverse=True)
    top = scored[: request.top_k]

    if not top:
        # Fallback: keyword search over all chunks when semantic similarity is too low
        keywords = [w.lower() for w in request.question.split() if len(w) > 2]
        keyword_chunks = (
            db.query(DocumentChunk)
            .options(joinedload(DocumentChunk.document))
            .filter(DocumentChunk.workspace_id == current_user.workspace_id)
            .all()
        )
        keyword_matches: list[tuple[DocumentChunk, float]] = []
        for chunk in keyword_chunks:
            content_lower = chunk.content.lower()
            hit_count = sum(1 for kw in keywords if kw in content_lower)
            if hit_count > 0:
                keyword_matches.append((chunk, hit_count / len(keywords)))

        keyword_matches.sort(key=lambda x: x[1], reverse=True)
        top = keyword_matches[: request.top_k]

    if not top:
        return AskResponse(
            answer="I couldn't find any relevant documents to answer your question.",
            sources=[],
        )

    contexts = [
        {"title": chunk.document.title, "content": chunk.content} for chunk, _ in top
    ]

    try:
        answer = answer_question(request.question, contexts)
    except RAGError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    # Deduplicate sources by document, keeping the highest chunk score per doc
    best: dict[int, tuple[Document, float]] = {}
    for chunk, score in top:
        doc = chunk.document
        if doc.id not in best or score > best[doc.id][1]:
            best[doc.id] = (doc, score)

    return AskResponse(
        answer=answer,
        sources=[
            AskSource(id=doc.id, title=doc.title, score=round(score, 4))
            for doc, score in best.values()
        ],
    )
