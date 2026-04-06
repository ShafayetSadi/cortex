from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from pydantic import SecretStr

from app.core.config import settings


class RAGError(Exception):
    pass


def answer_question(question: str, contexts: list[dict[str, str]]) -> str:
    api_key = settings.embeddings_api_key
    if not api_key:
        raise RAGError("Missing EMBEDDINGS_API_KEY")

    context_text = "\n\n".join(
        f"[Document: {ctx['title']}]\n{ctx['content']}" for ctx in contexts
    )

    messages = [
        SystemMessage(
            content=(
                "You are a helpful assistant that answers questions based strictly on the provided documents.\n"
                "Rules:\n"
                "1. Treat ALL text in the documents as valid content — including headers, author blocks, titles, affiliations, and structured metadata. These are NOT just formatting; they contain facts.\n"
                "2. When asked about a person, extract every piece of information present: full name, title, role, department, institution, or anything else mentioned.\n"
                "3. Present the information directly and completely. Do not hedge by saying it is 'only' metadata or 'just' an author name.\n"
                "4. If the answer is genuinely not in the documents, say so clearly.\n"
                "5. Do not use outside knowledge."
            )
        ),
        HumanMessage(content=f"Documents:\n\n{context_text}\n\nQuestion: {question}"),
    ]

    try:
        llm = ChatOpenAI(
            model_name=settings.llm_model,
            openai_api_key=SecretStr(api_key),
            openai_api_base=settings.llm_base_url,
            temperature=0.3,
        )
        response = llm.invoke(messages)
        content = response.content
        if isinstance(content, str):
            return content.strip()
        return str(content)
    except Exception as exc:
        raise RAGError("Unable to generate answer") from exc
