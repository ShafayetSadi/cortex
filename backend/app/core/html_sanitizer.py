import re
from html import escape
from html.parser import HTMLParser
from urllib.parse import urlparse


ALLOWED_TAGS = {
    "a",
    "b",
    "blockquote",
    "br",
    "code",
    "em",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "i",
    "li",
    "ol",
    "p",
    "pre",
    "strong",
    "u",
    "ul",
}
VOID_TAGS = {"br"}
DANGEROUS_TAGS = {"iframe", "object", "script", "style"}
ALLOWED_SCHEMES = {"http", "https", "mailto"}


def strip_html_to_text(html: str) -> str:
    without_tags = re.sub(r"<[^>]*>", " ", html)
    return re.sub(r"\s+", " ", without_tags).strip()


def sanitize_html(value: str) -> str:
    parser = _HTMLSanitizer()
    parser.feed(value or "")
    parser.close()
    return parser.get_html()


class _HTMLSanitizer(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=False)
        self._parts: list[str] = []
        self._skip_depth = 0

    def get_html(self) -> str:
        return "".join(self._parts)

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag in DANGEROUS_TAGS:
            self._skip_depth += 1
            return
        if self._skip_depth or tag not in ALLOWED_TAGS:
            return

        serialized_attrs = ""
        if tag == "a":
            href = self._sanitize_href(dict(attrs).get("href"))
            if href:
                serialized_attrs = f' href="{escape(href, quote=True)}" rel="noopener noreferrer"'

        self._parts.append(f"<{tag}{serialized_attrs}>")

    def handle_endtag(self, tag: str) -> None:
        if tag in DANGEROUS_TAGS:
            if self._skip_depth:
                self._skip_depth -= 1
            return
        if self._skip_depth or tag not in ALLOWED_TAGS or tag in VOID_TAGS:
            return
        self._parts.append(f"</{tag}>")

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self.handle_starttag(tag, attrs)

    def handle_data(self, data: str) -> None:
        if not self._skip_depth:
            self._parts.append(escape(data))

    def handle_entityref(self, name: str) -> None:
        if not self._skip_depth:
            self._parts.append(f"&{name};")

    def handle_charref(self, name: str) -> None:
        if not self._skip_depth:
            self._parts.append(f"&#{name};")

    def _sanitize_href(self, href: str | None) -> str | None:
        if not href:
            return None

        candidate = href.strip()
        parsed = urlparse(candidate)
        if parsed.scheme and parsed.scheme.lower() not in ALLOWED_SCHEMES:
            return None
        if candidate.lower().startswith(("javascript:", "data:")):
            return None
        return candidate
