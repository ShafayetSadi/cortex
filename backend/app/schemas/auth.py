from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    invite_token: str  # required — must have a valid workspace invite to register


class RegisterWorkspaceRequest(BaseModel):
    workspace_name: str
    admin_name: str
    admin_email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: str | None = None
