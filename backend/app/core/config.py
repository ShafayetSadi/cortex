from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Cortex API"
    jwt_secret_key: str = "supersecretkey"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    database_url: str = "sqlite:///./app.db"
    embeddings_api_key: str = ""
    embeddings_model: str = "text-embedding-3-small"
    embeddings_base_url: str = "https://models.inference.ai.azure.com"
    llm_model: str = "gpt-4o-mini"
    llm_base_url: str = "https://api.openai.com/v1"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    # Superadmin seed (all three must be set to auto-create on startup)
    superadmin_name: str = ""
    superadmin_email: str = ""
    superadmin_password: str = ""

    # Usage limits
    max_file_size_mb: int = 2
    max_documents_per_workspace: int = 5
    max_queries_per_day: int = 20
    max_query_length: int = 1000
    max_users_per_workspace: int = 5

    @property
    def parsed_cors_origins(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    model_config = SettingsConfigDict(
        env_file=(Path(__file__).resolve().parents[2] / ".env", ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
