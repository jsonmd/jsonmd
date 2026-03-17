"""Markdown table rendering utilities."""

from __future__ import annotations

from typing import Any


def _escape_cell(value: Any) -> str:
    """Escape a value for use in a Markdown table cell."""
    if value is None:
        return ""
    s = str(value)
    return s.replace("|", "\\|").replace("\n", " ")


def _format_value(value: Any) -> str:
    """Format a value for display in a Markdown cell."""
    if value is None:
        return ""
    if isinstance(value, bool):
        return str(value).lower()
    if isinstance(value, (int, float)):
        return str(value)
    if isinstance(value, str):
        return value
    import json
    return json.dumps(value)


def is_primitive(value: Any) -> bool:
    """Check if a value is a primitive (str, int, float, bool, None)."""
    return value is None or isinstance(value, (str, int, float, bool))


def is_flat(obj: dict) -> bool:
    """Check if a dict has only primitive values."""
    return all(is_primitive(v) for v in obj.values())


def to_table(rows: list[dict]) -> str:
    """Convert a list of flat dicts to a Markdown table."""
    if not rows:
        return ""

    # Collect union of keys in first-occurrence order
    seen: dict[str, None] = {}
    for row in rows:
        for key in row:
            if key not in seen:
                seen[key] = None
    keys = list(seen.keys())

    lines = []
    lines.append("| " + " | ".join(keys) + " |")
    lines.append("| " + " | ".join("---" for _ in keys) + " |")

    for row in rows:
        cells = [_escape_cell(_format_value(row.get(k))) for k in keys]
        lines.append("| " + " | ".join(cells) + " |")

    return "\n".join(lines)


def to_key_value_table(obj: dict) -> str:
    """Convert a flat dict to a 2-column Key | Value table."""
    if not obj:
        return ""

    lines = []
    lines.append("| Key | Value |")
    lines.append("| --- | --- |")

    for key, value in obj.items():
        lines.append(f"| {_escape_cell(key)} | {_escape_cell(_format_value(value))} |")

    return "\n".join(lines)


def to_bullet_list(items: list) -> str:
    """Convert a list of primitives to a Markdown bullet list."""
    return "\n".join(f"- {_format_value(item)}" for item in items)
