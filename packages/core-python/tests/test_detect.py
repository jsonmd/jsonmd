from jsonmd.detect import detect_request


def test_jsonmd_extension():
    result = detect_request("/api/users.jsonmd")
    assert result.should_convert
    assert result.clean_url == "/api/users"


def test_json_md_extension():
    result = detect_request("/api/users.json.md")
    assert result.should_convert
    assert result.clean_url == "/api/users"


def test_md_extension():
    result = detect_request("/api/users.md")
    assert result.should_convert
    assert result.clean_url == "/api/users"


def test_preserve_query_params():
    result = detect_request("/api/users.jsonmd?page=2&limit=10")
    assert result.should_convert
    assert result.clean_url == "/api/users?page=2&limit=10"


def test_no_trigger():
    result = detect_request("/api/users")
    assert not result.should_convert


def test_accept_header():
    result = detect_request("/api/users", {"accept": "text/markdown"})
    assert result.should_convert


def test_format_query_param():
    result = detect_request("/api/users?format=md")
    assert result.should_convert
    assert result.clean_url == "/api/users"


def test_x_format_header():
    result = detect_request("/api/users", {"x-format": "markdown"})
    assert result.should_convert


def test_mode_detection():
    result = detect_request("/api/tools.jsonmd?mode=signatures")
    assert result.should_convert
    assert result.mode == "signatures"
