import io

import pypdf


class PDFExtractionError(Exception):
    pass


def extract_text_from_pdf(content: bytes) -> str:
    try:
        reader = pypdf.PdfReader(io.BytesIO(content))
        pages = [page.extract_text() or "" for page in reader.pages]
        text = "\n".join(pages).strip()
    except Exception as exc:
        raise PDFExtractionError("Failed to read PDF") from exc

    if not text:
        raise PDFExtractionError("PDF has no extractable text")

    return text
