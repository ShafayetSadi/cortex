from datetime import datetime

from pydantic import BaseModel, ConfigDict


class WorkspaceBase(BaseModel):
    name: str
    slug: str


class WorkspaceCreate(WorkspaceBase):
    pass


class WorkspaceUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None


class WorkspaceOut(WorkspaceBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class InviteCreate(BaseModel):
    email: str | None = None  # optional: lock invite to a specific email


class InviteOut(BaseModel):
    invite_url: str
    token: str
    expires_at: datetime
    email: str | None = None

