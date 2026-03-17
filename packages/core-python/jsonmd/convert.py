"""Core JSON to Markdown conversion."""

from __future__ import annotations

import json
from typing import Any

from .table import to_table, to_key_value_table, to_bullet_list, is_primitive, is_flat
from .mcp import is_mcp_tool_list, mcp_to_md


def _is_object(value: Any) -> bool:
    return isinstance(value, dict)


def _render_nested(data: Any, depth: int, max_depth: int) -> str:
    if depth > max_depth:
        return "`" + json.dumps(data) + "`"

    if data is None:
        return ""
    if is_primitive(data):
        if isinstance(data, bool):
            return str(data).lower()
        return str(data)

    if isinstance(data, list):
        if len(data) == 0:
            return ""

        # Array of primitives
        if all(is_primitive(item) for item in data):
            return to_bullet_list(data)

        # Array of flat objects
        if all(_is_object(item) and is_flat(item) for item in data):
            return to_table(data)

        # Array of objects (possibly with nested) - try table if mostly flat
        if all(_is_object(item) for item in data):
            flat_count = sum(1 for item in data if is_flat(item))
            if flat_count / len(data) >= 0.8:
                return to_table(data)

        # Mixed/nested array
        heading = "#" * min(depth + 1, 6)
        sections = []
        for i, item in enumerate(data):
            sections.append(f"{heading} [{i}]\n\n{_render_nested(item, depth + 1, max_depth)}")
        return "\n\n".join(sections)

    if _is_object(data):
        if len(data) == 0:
            return ""

        if is_flat(data):
            return to_key_value_table(data)

        # Nested object
        heading = "#" * min(depth + 1, 6)
        sections = []
        for key, value in data.items():
            if is_primitive(value):
                display = "" if value is None else (str(value).lower() if isinstance(value, bool) else str(value))
                sections.append(f"{heading} {key}\n\n{display}")
            else:
                sections.append(f"{heading} {key}\n\n{_render_nested(value, depth + 1, max_depth)}")
        return "\n\n".join(sections)

    return str(data)


def smart_convert(data: Any, *, mode: str = "table", max_depth: int = 6, title: str | None = None) -> str:
    """Smart convert JSON data to Markdown, auto-detecting the best representation."""
    if is_mcp_tool_list(data):
        return mcp_to_md(data, mode)

    parts = []
    if title:
        parts.append(f"# {title}")
        parts.append("")

    body = _render_nested(data, 1, max_depth)
    if body:
        parts.append(body)

    return "\n".join(parts)


def json_to_md(data: Any, title: str | None = None) -> str:
    """Alias for smart_convert with title support."""
    return smart_convert(data, title=title)
