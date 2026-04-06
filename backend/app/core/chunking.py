def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> list[str]:
    """Split text into overlapping chunks of approximately chunk_size characters."""
    if not text:
        return []

    chunks: list[str] = []
    start = 0
    step = chunk_size - overlap

    while start < len(text):
        chunk = text[start : start + chunk_size].strip()
        if chunk:
            chunks.append(chunk)
        start += step

    return chunks
