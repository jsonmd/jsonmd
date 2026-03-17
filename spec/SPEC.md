# jsonmd Conversion Specification

Version: 0.1.0

This document defines the rules for converting JSON data to Markdown. Both the JavaScript and Python implementations MUST produce identical output for the same input.

---

## 1. Shape Detection

Given a JSON value, determine its shape in this order:

1. **MCP Tool List** — Object with a `tools` key that is an array, where each element has a `name` (string) and either `inputSchema` or `parameters` (object).
2. **Array of flat objects** — A non-empty array where every element is an object and at least 80% of elements have only primitive values (string, number, boolean, null) for all their keys.
3. **Array of primitives** — A non-empty array where every element is a primitive.
4. **Flat object** — An object where every value is a primitive.
5. **Nested object** — An object with at least one non-primitive value.
6. **Nested array** — An array of mixed or nested elements.
7. **Primitive** — A string, number, boolean, or null.
8. **Empty** — `null`, `{}`, or `[]`.

---

## 2. Conversion Rules

### 2.1 Array of Flat Objects → Markdown Table

Given:
```json
[
  {"id": 1, "name": "Alice", "role": "admin"},
  {"id": 2, "name": "Bob", "role": "editor"}
]
```

Output:
```markdown
| id | name | role |
| --- | --- | --- |
| 1 | Alice | admin |
| 2 | Bob | editor |
```

Rules:
- Column headers are the **union** of all keys across all objects, in first-occurrence order.
- Missing values render as empty string.
- Pipe characters (`|`) in values MUST be escaped as `\|`.
- Newlines in values MUST be replaced with a single space.
- Boolean values render as `true` / `false`.
- Null values render as empty string.
- Numeric values render as their string representation (no quotes).

### 2.2 Flat Object → Key-Value Table

Given:
```json
{"name": "Alice", "role": "admin", "active": true}
```

Output:
```markdown
| Key | Value |
| --- | --- |
| name | Alice |
| role | admin |
| active | true |
```

### 2.3 Nested Object → Headings + Recursion

Given:
```json
{
  "user": {"name": "Alice", "role": "admin"},
  "settings": {"theme": "dark", "lang": "en"}
}
```

Output:
```markdown
## user

| Key | Value |
| --- | --- |
| name | Alice |
| role | admin |

## settings

| Key | Value |
| --- | --- |
| theme | dark |
| lang | en |
```

Rules:
- Each top-level key becomes a heading at the current depth.
- Top-level starts at `##`. Each recursion level increments by one (`###`, `####`, etc.).
- Maximum depth: 6 (matching Markdown heading limit `######`).
- At max depth, render remaining nested values as inline JSON.

### 2.4 Array of Primitives → Bullet List

Given:
```json
["typescript", "python", "rust"]
```

Output:
```markdown
- typescript
- python
- rust
```

### 2.5 Nested Array → Indexed Sections

Given an array of mixed/nested elements, render each element with an index heading:

```markdown
## [0]

(recursive render of element 0)

## [1]

(recursive render of element 1)
```

### 2.6 Primitive Values

- Strings render as-is (no quotes).
- Numbers render as their string representation.
- Booleans render as `true` / `false`.
- `null` renders as empty string.

### 2.7 Empty Values

- `null` → empty string
- `{}` → empty string
- `[]` → empty string

---

## 3. MCP Schema Compression

### 3.1 Detection

A value is an MCP tool list if:
- It is an object with a `tools` key
- `tools` is an array
- Each element has `name` (string) and either `inputSchema` or `parameters` (object)

### 3.2 Table Mode (default)

Output a summary table followed by per-tool parameter tables:

```markdown
# Tools

| Tool | Description |
| --- | --- |
| get_weather | Get current weather for a location |
| create_issue | Create a GitHub issue |

## get_weather

Get current weather for a location

| Param | Type | Req | Description |
| --- | --- | --- | --- |
| location | string | ✓ | City name or zip code |
| units | string | | Temperature units |
```

Rules:
- Summary table lists all tools with name and description.
- Each tool gets an `##` heading.
- Description appears as a paragraph after the heading.
- Parameters are extracted from `inputSchema.properties` or `parameters.properties`.
- Required parameters show `✓` in the Req column.
- Type is extracted from the property's `type` field.
- If `type` is an array, join with ` | ` (e.g., `string | null`).
- If `enum` is present, render as the type followed by values (e.g., `string`).

### 3.3 Signatures Mode

Output one-liner function signatures:

```markdown
# Tools

- `get_weather(location: string, units?: string)` — Get current weather for a location
- `create_issue(owner: string, repo: string, title: string, body?: string)` — Create a GitHub issue
```

Rules:
- Required params: `name: type`
- Optional params: `name?: type`
- Array types: `type[]`
- Description follows ` — ` (em dash).

---

## 4. Request Detection

A request should be converted to Markdown if ANY of these conditions are met (checked in order):

1. **URL extension**: Path ends with `.jsonmd`, `.json.md`, or `.md`
   - Strip the extension from the path
   - Preserve query parameters
   - Example: `/api/users.jsonmd?page=2` → `/api/users?page=2`

2. **Accept header**: Contains `text/markdown`

3. **Query parameter**: `format=md` or `format=markdown`
   - Remove the `format` parameter from the query string
   - Preserve other query parameters

4. **Custom header**: `X-Format` equals `markdown` (case-insensitive)

---

## 5. Response Headers

Every converted response MUST include:

```
Content-Type: text/markdown; charset=utf-8
X-Converted-By: jsonmd
X-Token-JSON: <estimated tokens for compact JSON>
X-Token-Markdown: <estimated tokens for markdown output>
X-Token-Savings: <percentage>%
```

### Token Estimation

Tokens are estimated as: `Math.ceil(text.length / 4)`

This is a rough approximation of GPT/Claude tokenization. It's fast and consistent.

### Savings Calculation

```
savings = ((tokenJson - tokenMarkdown) / tokenJson) * 100
```

Format as a percentage with one decimal place, e.g., `55.9%`. If savings are negative (Markdown is larger), still report the negative value.

---

## 6. Title Support

An optional `title` parameter may be provided. When present:
- For tables: render as `# Title` heading above the table
- For other shapes: render as `# Title` heading above the content

---

## 7. Mode Parameter

The `mode` query parameter controls MCP output format:
- `?mode=table` or omitted: Table mode (default)
- `?mode=signatures`: Signatures mode

This parameter is only meaningful for MCP tool list data. For non-MCP data, it is ignored.
