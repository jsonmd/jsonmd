"""Request detection for jsonmd conversion triggers."""

from __future__ import annotations

from dataclasses import dataclass, field
from urllib.parse import urlparse, parse_qs, urlencode


EXTENSIONS = [".jsonmd", ".json.md", ".md"]


@dataclass
class DetectResult:
    should_convert: bool = False
    clean_url: str = ""
    mode: str | None = None


def detect_request(url: str, headers: dict[str, str] | None = None) -> DetectResult:
    """Detect if a request should be converted to Markdown."""
    headers = headers or {}

    def header_get(name: str) -> str | None:
        return headers.get(name) or headers.get(name.lower())

    # Parse URL
    if "?" in url:
        path, query_string = url.split("?", 1)
    else:
        path, query_string = url, ""

    # 1. Check URL extension
    for ext in EXTENSIONS:
        if path.endswith(ext):
            clean_path = path[: -len(ext)]
            clean_url = clean_path + ("?" + query_string if query_string else "")
            mode = _parse_mode(query_string)
            return DetectResult(should_convert=True, clean_url=clean_url, mode=mode)

    # 2. Check Accept header
    accept = header_get("accept")
    if accept and "text/markdown" in accept:
        mode = _parse_mode(query_string)
        return DetectResult(should_convert=True, clean_url=url, mode=mode)

    # 3. Check query parameter
    if query_string:
        params = parse_qs(query_string, keep_blank_values=True)
        fmt = params.get("format", [None])[0]
        if fmt in ("md", "markdown"):
            new_params = {k: v for k, v in params.items() if k != "format"}
            mode_val = new_params.pop("mode", [None])[0] if "mode" in new_params else None
            remaining = urlencode(new_params, doseq=True)
            clean_url = path + ("?" + remaining if remaining else "")
            return DetectResult(should_convert=True, clean_url=clean_url, mode=mode_val)

    # 4. Check X-Format header
    x_format = header_get("x-format")
    if x_format and x_format.lower() == "markdown":
        mode = _parse_mode(query_string)
        return DetectResult(should_convert=True, clean_url=url, mode=mode)

    return DetectResult(should_convert=False, clean_url=url)


def _parse_mode(query_string: str) -> str | None:
    if not query_string:
        return None
    params = parse_qs(query_string)
    mode = params.get("mode", [None])[0]
    if mode in ("table", "signatures"):
        return mode
    return None
