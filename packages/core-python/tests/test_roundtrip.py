from jsonmd.roundtrip import md_to_json
from jsonmd.convert import smart_convert


def test_parse_simple_table():
    md = "| id | name |\n| --- | --- |\n| 1 | Alice |\n| 2 | Bob |"
    result = md_to_json(md)
    assert result == [{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}]


def test_parse_key_value_table():
    md = "| Key | Value |\n| --- | --- |\n| name | Alice |\n| role | admin |"
    result = md_to_json(md)
    assert result == {"name": "Alice", "role": "admin"}


def test_coerce_types():
    md = "| a | b | c | d |\n| --- | --- | --- | --- |\n| 42 | true | false |  |"
    result = md_to_json(md)
    assert result[0] == {"a": 42, "b": True, "c": False, "d": None}


def test_escaped_pipes():
    md = "| cmd |\n| --- |\n| a \\| b |"
    result = md_to_json(md)
    assert result[0]["cmd"] == "a | b"


def test_non_table_input():
    assert md_to_json("just some text") is None
    assert md_to_json("") is None


def test_roundtrip_array():
    original = [
        {"id": 1, "name": "Alice", "role": "admin"},
        {"id": 2, "name": "Bob", "role": "editor"},
    ]
    md = smart_convert(original)
    parsed = md_to_json(md)
    assert parsed == original


def test_roundtrip_flat_object():
    original = {"name": "Alice", "role": "admin", "active": True}
    md = smart_convert(original)
    parsed = md_to_json(md)
    assert parsed == original
