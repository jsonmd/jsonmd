"""Token estimation utilities."""

import math


def estimate_tokens(text: str) -> int:
    """Estimate token count for a string. Uses chars/4 approximation."""
    return math.ceil(len(text) / 4)
