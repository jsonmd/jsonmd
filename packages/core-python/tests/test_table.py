from jsonmd.table import to_table, to_key_value_table, to_bullet_list, is_primitive, is_flat


def test_to_table():
    result = to_table([
        {"id": 1, "name": "Alice", "role": "admin"},
        {"id": 2, "name": "Bob", "role": "editor"},
    ])
    assert "| id | name | role |" in result
    assert "| 1 | Alice | admin |" in result
    assert "| 2 | Bob | editor |" in result


def test_to_table_missing_keys():
    result = to_table([{"a": 1, "b": 2}, {"a": 3, "c": 4}])
    assert "| a | b | c |" in result
    assert "| 1 | 2 |  |" in result
    assert "| 3 |  | 4 |" in result


def test_to_table_escape_pipe():
    result = to_table([{"cmd": "a | b"}])
    assert "a \\| b" in result


def test_to_table_empty():
    assert to_table([]) == ""


def test_to_key_value_table():
    result = to_key_value_table({"name": "Alice", "role": "admin"})
    assert "| Key | Value |" in result
    assert "| name | Alice |" in result


def test_to_key_value_table_empty():
    assert to_key_value_table({}) == ""


def test_to_bullet_list():
    assert to_bullet_list(["a", "b", "c"]) == "- a\n- b\n- c"


def test_is_primitive():
    assert is_primitive("str")
    assert is_primitive(42)
    assert is_primitive(True)
    assert is_primitive(None)
    assert not is_primitive({})
    assert not is_primitive([])


def test_is_flat():
    assert is_flat({"a": 1, "b": "x", "c": None})
    assert not is_flat({"a": 1, "b": {"nested": True}})
