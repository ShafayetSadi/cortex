from typing import Any

import httpx

from app.core.config import settings


class EmbeddingError(Exception):
    pass


def generate_embedding(text: str) -> list[float]:
    api_key = settings.embeddings_api_key or settings.github_token

    if not api_key:
        raise EmbeddingError("Missing EMBEDDINGS_API_KEY or GITHUB_TOKEN")

    endpoint = f"{settings.embeddings_base_url.rstrip('/')}/embeddings"
    payload: dict[str, Any] = {
        "model": settings.embeddings_model,
        "input": text,
    }
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    try:
        response = httpx.post(endpoint, json=payload, headers=headers, timeout=30)
        response.raise_for_status()
        return response.json()["data"][0]["embedding"]
    except (httpx.HTTPError, KeyError, IndexError, TypeError, ValueError) as exc:
        raise EmbeddingError("Unable to generate embedding") from exc
