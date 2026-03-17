"""Parse Markdown tables back to JSON."""

from __future__ import annotations

from typing import Any


def md_to_json(md: str) -> Any:
    """Parse a Markdown table back to JSON (array of objects). Best-effort."""
    lines = md.split("\n")
    tables: list[dict] = []

    i = 0
    while i < len(lines):
        line = lines[i].strip()

        if line.startswith("|") and i + 1 < len(lines):
            headers = _parse_cells(line)
            next_line = lines[i + 1].strip() if i + 1 < len(lines) else ""

            if next_line.startswith("|") and "---" in next_line:
                i += 2
                rows = []

                while i < len(lines) and lines[i].strip().startswith("|"):
                    cells = _parse_cells(lines[i].strip())
                    row = {}
                    for j, header in enumerate(headers):
                        row[header] = _coerce(cells[j] if j < len(cells) else "")
                    rows.append(row)
                    i += 1

                # Key-Value table detection
                if len(headers) == 2 and headers[0] == "Key" and headers[1] == "Value":
                    obj = {}
                    for row in rows:
                        key = str(row.get("Key", ""))
                        if key:
                            obj[key] = row["Value"]
                    tables.append({"headers": headers, "rows": [obj]})
                else:
                    tables.append({"headers": headers, "rows": rows})
                continue

        i += 1

    if not tables:
        return None
    if len(tables) == 1:
        t = tables[0]
        if len(t["headers"]) == 2 and t["headers"][0] == "Key" and t["headers"][1] == "Value":
            return t["rows"][0]
        return t["rows"]

    result = []
    for t in tables:
        result.extend(t["rows"])
    return result


def _parse_cells(line: str) -> list[str]:
    """Split a table row by | but not \\|."""
    inner = line.strip("|")
    cells = []
    current = ""
    i = 0
    while i < len(inner):
        if inner[i] == "\\" and i + 1 < len(inner) and inner[i + 1] == "|":
            current += "|"
            i += 2
        elif inner[i] == "|":
            cells.append(current.strip())
            current = ""
            i += 1
        else:
            current += inner[i]
            i += 1
    cells.append(current.strip())
    return cells


def _coerce(value: str) -> Any:
    """Coerce a string value to an appropriate Python type."""
    if value == "":
        return None
    if value == "true":
        return True
    if value == "false":
        return False
    if value == "null":
        return None

    try:
        # Try int first
        if "." not in value and "e" not in value.lower():
            return int(value)
        return float(value)
    except (ValueError, OverflowError):
        pass

    return value
