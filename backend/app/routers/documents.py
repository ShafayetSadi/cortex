from math import sqrt

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.embeddings import EmbeddingError, generate_embedding
from app.core.html_sanitizer import sanitize_html, strip_html_to_text
from app.core.pdf import PDFExtractionError, extract_text_from_pdf
from app.core.rag import RAGError, answer_question
from app.deps import get_current_user
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


def serialize_document(doc: Document) -> DocumentOut:
    return DocumentOut(
        id=doc.id,
        title=doc.title,
        description=sanitize_html(doc.description),
        created_by=doc.created_by,
        created_at=doc.created_at,
        updated_at=doc.updated_at,
    )


def serialize_public_document(doc: Document) -> PublicDocumentOut:
    return PublicDocumentOut(
        id=doc.id,
        title=doc.title,
        description=sanitize_html(doc.description),
        created_at=doc.created_at,
        author_id=doc.creator.id,
        author_name=doc.creator.name,
    )


# --- Authenticated document management ---

@router.get("/", response_model=list[DocumentOut])
def list_documents(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(Document)
    if current_user.role != "admin":
        query = query.filter(Document.created_by == current_user.id)
    return [serialize_document(doc) for doc in query.order_by(Document.created_at.desc()).all()]


@router.post("/", response_model=DocumentOut, status_code=201)
async def create_document(
    title: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    try:
        content = extract_text_from_pdf(await file.read())
    except PDFExtractionError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    doc = Document(
        title=title,
        description=content,
        embedding=try_generate_embedding(content),
        created_by=current_user.id,
    )
    db.add(doc)
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
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if current_user.role != "admin" and doc.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    if title:
        doc.title = title

    if file:
        if not file.filename or not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Only PDF files are supported")
        try:
            content = extract_text_from_pdf(await file.read())
        except PDFExtractionError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc
        doc.description = content
        doc.embedding = try_generate_embedding(content)

    db.commit()
    db.refresh(doc)
    return serialize_document(doc)


@router.delete("/{document_id}", status_code=204)
def delete_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if current_user.role != "admin" and doc.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    db.delete(doc)
    db.commit()


# --- Public endpoints ---

@public_router.get("/documents/", response_model=list[PublicDocumentOut])
def list_public_documents(db: Session = Depends(get_db)):
    docs = db.query(Document).join(Document.creator).order_by(Document.created_at.desc()).all()
    return [serialize_public_document(doc) for doc in docs]


@public_router.get("/documents/{document_id}", response_model=PublicDocumentOut)
def get_public_document(document_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).join(Document.creator).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return serialize_public_document(doc)


@public_router.post("/ask", response_model=AskResponse)
def ask(request: AskRequest, db: Session = Depends(get_db)):
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    question_embedding = try_generate_embedding(request.question)
    if question_embedding is None:
        raise HTTPException(status_code=503, detail="Unable to process question")

    docs = db.query(Document).filter(Document.embedding.isnot(None)).all()

    scored = [
        (doc, cosine_similarity(question_embedding, doc.embedding))
        for doc in docs
    ]
    scored = [(doc, score) for doc, score in scored if score >= request.threshold]
    scored.sort(key=lambda x: x[1], reverse=True)
    top = scored[: request.top_k]

    if not top:
        return AskResponse(
            answer="I couldn't find any relevant documents to answer your question.",
            sources=[],
        )

    contexts = [
        {"title": doc.title, "content": strip_html_to_text(doc.description)}
        for doc, _ in top
    ]

    try:
        answer = answer_question(request.question, contexts)
    except RAGError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    return AskResponse(
        answer=answer,
        sources=[AskSource(id=doc.id, title=doc.title, score=round(score, 4)) for doc, score in top],
    )
