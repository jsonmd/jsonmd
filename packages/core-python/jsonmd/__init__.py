"""jsonmd - Append .jsonmd to any API endpoint. Get Markdown back. Save 15-55% LLM tokens."""

from .convert import smart_convert, json_to_md
from .roundtrip import md_to_json
from .tokens import estimate_tokens
from .table import to_table, to_key_value_table, to_bullet_list
from .mcp import mcp_to_md, is_mcp_tool_list
from .detect import detect_request
from .middleware import enable

__all__ = [
    "smart_convert",
    "json_to_md",
    "md_to_json",
    "estimate_tokens",
    "to_table",
    "to_key_value_table",
    "to_bullet_list",
    "mcp_to_md",
    "is_mcp_tool_list",
    "detect_request",
    "enable",
]
