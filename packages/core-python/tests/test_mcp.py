from jsonmd.mcp import is_mcp_tool_list, mcp_to_md


MCP_DATA = {
    "tools": [
        {
            "name": "get_weather",
            "description": "Get current weather for a location",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "location": {"type": "string", "description": "City name or zip code"},
                    "units": {"type": "string", "description": "Temperature units"},
                },
                "required": ["location"],
            },
        },
        {
            "name": "create_issue",
            "description": "Create a GitHub issue",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "owner": {"type": "string", "description": "Repository owner"},
                    "repo": {"type": "string", "description": "Repository name"},
                    "title": {"type": "string", "description": "Issue title"},
                },
                "required": ["owner", "repo", "title"],
            },
        },
    ]
}


def test_is_mcp_tool_list():
    assert is_mcp_tool_list(MCP_DATA)
    assert not is_mcp_tool_list([])
    assert not is_mcp_tool_list({"tools": []})
    assert not is_mcp_tool_list({"tools": [{"name": "x"}]})
    assert not is_mcp_tool_list(None)


def test_mcp_table_mode():
    md = mcp_to_md(MCP_DATA, "table")
    assert "# Tools" in md
    assert "| Tool | Description |" in md
    assert "| get_weather | Get current weather for a location |" in md
    assert "## get_weather" in md
    assert "| location | string | ✓ | City name or zip code |" in md


def test_mcp_signatures_mode():
    md = mcp_to_md(MCP_DATA, "signatures")
    assert "# Tools" in md
    assert "`get_weather(location: string, units?: string)`" in md
    assert "`create_issue(owner: string, repo: string, title: string)`" in md
