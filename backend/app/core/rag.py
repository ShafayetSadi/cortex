from typing import Any

import httpx

from app.core.config import settings


class RAGError(Exception):
    pass


def answer_question(question: str, contexts: list[dict[str, str]]) -> str:
    api_key = settings.embeddings_api_key
    if not api_key:
        raise RAGError("Missing EMBEDDINGS_API_KEY")

    context_text = "\n\n".join(
        f"[Document: {ctx['title']}]\n{ctx['content']}"
        for ctx in contexts
    )

    endpoint = f"{settings.llm_base_url.rstrip('/')}/chat/completions"
    payload: dict[str, Any] = {
        "model": settings.summary_model,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are a helpful assistant that answers questions based strictly on the provided documents. "
                    "If the answer is not found in the documents, say so clearly. "
                    "Do not use outside knowledge."
                ),
            },
            {
                "role": "user",
                "content": f"Documents:\n\n{context_text}\n\nQuestion: {question}",
            },
        ],
        "temperature": 0.3,
    }
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    try:
        response = httpx.post(endpoint, json=payload, headers=headers, timeout=60)
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"].strip()
    except (httpx.HTTPError, KeyError, IndexError, TypeError, ValueError) as exc:
        raise RAGError("Unable to generate answer") from exc
