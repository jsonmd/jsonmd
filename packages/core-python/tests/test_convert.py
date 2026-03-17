from jsonmd.convert import smart_convert, json_to_md


def test_array_of_flat_objects():
    data = [{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}]
    md = smart_convert(data)
    assert "| id | name |" in md
    assert "| 1 | Alice |" in md


def test_flat_object():
    md = smart_convert({"name": "Alice", "role": "admin"})
    assert "| Key | Value |" in md
    assert "| name | Alice |" in md


def test_array_of_primitives():
    md = smart_convert(["ts", "py", "rs"])
    assert md == "- ts\n- py\n- rs"


def test_nested_object():
    md = smart_convert({
        "user": {"name": "Alice", "role": "admin"},
        "settings": {"theme": "dark"},
    })
    assert "## user" in md
    assert "## settings" in md


def test_empty_inputs():
    assert smart_convert(None) == ""
    assert smart_convert({}) == ""
    assert smart_convert([]) == ""


def test_title():
    md = smart_convert([{"id": 1}], title="Users")
    assert md.startswith("# Users\n")
    assert "| id |" in md


def test_mcp_detection():
    data = {
        "tools": [{
            "name": "get_weather",
            "description": "Get weather",
            "inputSchema": {
                "type": "object",
                "properties": {"location": {"type": "string", "description": "City"}},
                "required": ["location"],
            },
        }],
    }
    md = smart_convert(data)
    assert "# Tools" in md
    assert "get_weather" in md


def test_json_to_md():
    md = json_to_md([{"id": 1}], title="Test")
    assert "# Test" in md
    assert "| id |" in md
