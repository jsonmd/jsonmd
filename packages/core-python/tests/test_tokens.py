from jsonmd.tokens import estimate_tokens


def test_empty_string():
    assert estimate_tokens("") == 0


def test_short_strings():
    assert estimate_tokens("a") == 1
    assert estimate_tokens("abcd") == 1
    assert estimate_tokens("abcde") == 2


def test_long_string():
    assert estimate_tokens("a" * 1000) == 250
