"""FastAPI/Starlette middleware for jsonmd."""

from __future__ import annotations

import json
import math
from typing import Any

from .convert import smart_convert
from .detect import detect_request
from .tokens import estimate_tokens


def enable(app: Any) -> None:
    """Enable jsonmd middleware on a FastAPI or Starlette app.

    Usage:
        from fastapi import FastAPI
        from jsonmd import enable

        app = FastAPI()
        enable(app)
    """
    try:
        from starlette.middleware.base import BaseHTTPMiddleware
        from starlette.requests import Request
        from starlette.responses import Response
    except ImportError:
        raise ImportError(
            "starlette is required for middleware. Install with: pip install jsonmd[fastapi]"
        )

    class JsonmdMiddleware(BaseHTTPMiddleware):
        async def dispatch(self, request: Request, call_next: Any) -> Response:
            headers = dict(request.headers)
            url = str(request.url.path)
            if request.url.query:
                url += f"?{request.url.query}"

            detect = detect_request(url, headers)

            if not detect.should_convert:
                return await call_next(request)

            # Modify the request scope to use the clean URL
            clean_parts = detect.clean_url.split("?", 1)
            request.scope["path"] = clean_parts[0]
            request.scope["query_string"] = (
                clean_parts[1].encode() if len(clean_parts) > 1 else b""
            )

            response = await call_next(request)

            # Check if response is JSON
            content_type = response.headers.get("content-type", "")
            if "application/json" not in content_type:
                return response

            # Read the response body
            body_bytes = b""
            async for chunk in response.body_iterator:
                if isinstance(chunk, bytes):
                    body_bytes += chunk
                else:
                    body_bytes += chunk.encode()

            data = json.loads(body_bytes)
            md = smart_convert(data, mode=detect.mode or "table")
            json_str = json.dumps(data)
            token_json = estimate_tokens(json_str)
            token_md = estimate_tokens(md)
            savings = (
                f"{((1 - token_md / token_json) * 100):.1f}"
                if token_json > 0
                else "0.0"
            )

            return Response(
                content=md,
                media_type="text/markdown; charset=utf-8",
                headers={
                    "X-Converted-By": "jsonmd",
                    "X-Token-JSON": str(token_json),
                    "X-Token-Markdown": str(token_md),
                    "X-Token-Savings": f"{savings}%",
                },
            )

    app.add_middleware(JsonmdMiddleware)
