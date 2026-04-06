from langchain_openai import OpenAIEmbeddings
from pydantic import SecretStr

from app.core.config import settings


class EmbeddingError(Exception):
    pass


def generate_embedding(text: str) -> list[float]:
    api_key = settings.embeddings_api_key
    if not api_key:
        raise EmbeddingError("Missing EMBEDDINGS_API_KEY")

    try:
        embeddings_client = OpenAIEmbeddings(
            model=settings.embeddings_model,
            openai_api_key=SecretStr(api_key),
            openai_api_base=settings.embeddings_base_url,
        )
        return embeddings_client.embed_query(text)
    except Exception as exc:
        raise EmbeddingError("Unable to generate embedding") from exc
