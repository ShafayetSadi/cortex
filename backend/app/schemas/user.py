from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr


class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: Literal["admin", "user", "superadmin"] = "user"


class UserCreate(UserBase):
    password: str
    workspace_id: int


class UserUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    password: str | None = None
    role: Literal["admin", "user", "superadmin"] | None = None


class UserOut(UserBase):
    id: int
    workspace_id: int
    created_at: datetime
    queries_today: int = 0
    queries_reset_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class SuperAdminUserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    workspace_id: int
    workspace_name: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WorkspaceStats(BaseModel):
    id: int
    name: str
    slug: str
    created_at: datetime
    user_count: int
    document_count: int

    model_config = ConfigDict(from_attributes=True)


class UsageOut(BaseModel):
    queries_used_today: int
    queries_limit: int
    documents_uploaded: int
    documents_limit: int
    file_size_limit_mb: int
    max_query_length: int
    workspace_users: int
    workspace_users_limit: int
