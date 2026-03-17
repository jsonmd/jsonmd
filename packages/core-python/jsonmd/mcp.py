"""MCP schema compression utilities."""

from __future__ import annotations

from typing import Any


def is_mcp_tool_list(data: Any) -> bool:
    """Detect if a value is an MCP tool list response."""
    if not isinstance(data, dict):
        return False
    tools = data.get("tools")
    if not isinstance(tools, list) or len(tools) == 0:
        return False
    return all(
        isinstance(t, dict)
        and isinstance(t.get("name"), str)
        and (isinstance(t.get("inputSchema"), dict) or isinstance(t.get("parameters"), dict))
        for t in tools
    )


def _get_schema(tool: dict) -> dict:
    return tool.get("inputSchema") or tool.get("parameters") or {}


def _type_str(prop: dict) -> str:
    t = prop.get("type", "unknown")
    if isinstance(t, list):
        return " | ".join(t)
    if t == "array" and isinstance(prop.get("items"), dict):
        item_type = prop["items"].get("type", "unknown")
        return f"{item_type}[]"
    return t


def _mcp_to_table(tools: list[dict]) -> str:
    lines = []
    lines.append("# Tools")
    lines.append("")
    lines.append("| Tool | Description |")
    lines.append("| --- | --- |")
    for tool in tools:
        lines.append(f"| {tool['name']} | {tool.get('description', '')} |")

    for tool in tools:
        schema = _get_schema(tool)
        props = schema.get("properties", {})
        if not props:
            continue

        required = set(schema.get("required", []))
        lines.append("")
        lines.append(f"## {tool['name']}")
        lines.append("")
        if tool.get("description"):
            lines.append(tool["description"])
            lines.append("")
        lines.append("| Param | Type | Req | Description |")
        lines.append("| --- | --- | --- | --- |")
        for name, prop in props.items():
            req = "✓" if name in required else ""
            lines.append(f"| {name} | {_type_str(prop)} | {req} | {prop.get('description', '')} |")

    return "\n".join(lines)


def _mcp_to_signatures(tools: list[dict]) -> str:
    lines = []
    lines.append("# Tools")
    lines.append("")

    for tool in tools:
        schema = _get_schema(tool)
        props = schema.get("properties", {})
        required = set(schema.get("required", []))

        params = []
        for name, prop in props.items():
            optional = "" if name in required else "?"
            params.append(f"{name}{optional}: {_type_str(prop)}")

        sig = f"{tool['name']}({', '.join(params)})"
        desc = f" — {tool['description']}" if tool.get("description") else ""
        lines.append(f"- `{sig}`{desc}")

    return "\n".join(lines)


def mcp_to_md(data: dict, mode: str = "table") -> str:
    """Convert MCP tool list to Markdown."""
    tools = data.get("tools", [])
    if mode == "signatures":
        return _mcp_to_signatures(tools)
    return _mcp_to_table(tools)
