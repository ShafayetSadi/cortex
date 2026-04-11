from datetime import datetime

from pydantic import BaseModel, ConfigDict


class DocumentCreate(BaseModel):
    title: str
    description: str


class DocumentUpdate(BaseModel):
    title: str | None = None
    description: str | None = None


class DocumentOut(BaseModel):
    id: int
    title: str
    description: str
    created_by: int
    collection_id: int | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PublicDocumentOut(BaseModel):
    id: int
    title: str
    description: str
    created_at: datetime
    author_id: int
    author_name: str


class AskSource(BaseModel):
    id: int
    title: str
    score: float


class AskRequest(BaseModel):
    question: str
    threshold: float = 0.2
    top_k: int = 5


class AskResponse(BaseModel):
    answer: str
    sources: list[AskSource]
