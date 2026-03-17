# jsonmd

**Append `.jsonmd` to any API endpoint. Get Markdown back. Save 15–55% LLM tokens.**

```
GET /api/users          → JSON
GET /api/users.jsonmd   → Markdown table
```

That's it. One middleware, zero route changes. Your existing API becomes LLM-optimized.

---

## Why

LLMs bill by the token. JSON is verbose. Every quoted key, every brace, every comma — tokens that carry structure but not meaning. Markdown tables encode the same data in 15–55% fewer tokens, and LLMs comprehend Markdown *better* than JSON because they've been trained on billions of GitHub READMEs, docs, and Stack Overflow posts.

TOON (Token-Oriented Object Notation) saves more tokens (30–60%), but independent benchmarks show it achieves only 43–47% comprehension accuracy versus 52–62% for Markdown. LLMs prefer formats they've seen in training, not formats theoretically optimized for them. Markdown wins because it's already native.

jsonmd also compresses MCP tool schemas. A typical MCP setup dumps 55,000+ tokens of JSON schemas into the context window before a single user message. jsonmd compresses that to under 5,000 tokens.

---

## Install

```bash
npm install jsonmd     # JavaScript (Express, Hono, Bun, Deno)
pip install jsonmd     # Python (FastAPI, Starlette)
```

## Setup

One line per framework. Nothing else changes.

**Express:**

```js
import { jsonmd } from 'jsonmd';

const app = express();
app.use(jsonmd());

app.get('/api/users', (req, res) => {
  res.json([
    { id: 1, name: 'Alice', role: 'admin' },
    { id: 2, name: 'Bob', role: 'editor' },
  ]);
});
```

**Hono:**

```js
import { jsonmdHono } from 'jsonmd';

const app = new Hono();
app.use('*', jsonmdHono({ app }));
```

**FastAPI:**

```python
from jsonmd import enable

app = FastAPI()
enable(app)

@app.get("/api/users")
async def get_users():
    return [{"id": 1, "name": "Alice", "role": "admin"}]
```

**Standalone proxy** (zero code changes to any existing API):

```bash
TARGET=https://api.example.com jsonmd-proxy --port 3001
```

---

## How It Works

The middleware intercepts every request. If the URL ends with `.jsonmd`, `.json.md`, or `.md`, it strips the extension, forwards to your real route handler, converts the JSON response to Markdown, and sends it back.

```
GET /api/users.jsonmd

  1. Middleware sees .jsonmd extension
  2. Strips it → forwards to /api/users
  3. Your route returns JSON normally
  4. Middleware intercepts the JSON response
  5. Converts to Markdown table
  6. Returns text/markdown with token stats headers

Response:
  Content-Type: text/markdown
  X-Token-JSON: 1460
  X-Token-Markdown: 644
  X-Token-Savings: 55.9%

  | id | name | role |
  | --- | --- | --- |
  | 1 | Alice | admin |
  | 2 | Bob | editor |
```

Three extensions are supported, all equivalent:

| Extension | Example | Notes |
| --- | --- | --- |
| `.jsonmd` | `/api/users.jsonmd` | Primary. Unique, unambiguous, googlable |
| `.md` | `/api/users.md` | Shorthand convenience |
| `.json.md` | `/api/users.json.md` | Explicit: "JSON, in Markdown" |

---

## Smart Conversion

jsonmd auto-detects the shape of your data and picks the best Markdown representation:

| JSON shape | Markdown output | Example |
| --- | --- | --- |
| Array of flat objects | Table | Database rows, API lists |
| Simple flat object | 2-column key/value table | Config, metadata |
| Nested object | Headings + recursion | Complex configs |
| Array of primitives | Bullet list | Tags, features |
| MCP tool schemas | Compressed tool catalog | Auto-detected |

No configuration needed. It just looks at the data.

---

## MCP Schema Compression

jsonmd auto-detects MCP `tools/list` responses and compresses them. If your API has an endpoint that returns MCP tool definitions, appending `.jsonmd` compresses the schemas automatically.

```
GET /mcp/tools            → 55,000 tokens of JSON schemas
GET /mcp/tools.jsonmd     → ~5,000 tokens of Markdown tables
GET /mcp/tools.jsonmd?mode=signatures  → ~2,000 tokens of function signatures
```

**Table mode** (default) produces per-tool parameter tables:

```markdown
# Tools

| Tool | Description |
| --- | --- |
| get_weather | Get current weather for a location |
| create_issue | Create a GitHub issue |

## get_weather

| Param | Type | Req | Description |
| --- | --- | --- | --- |
| location | string | ✓ | City name or zip code |
| units | string | | Temperature units (celsius, fahrenheit) |
```

**Signatures mode** (`?mode=signatures`) produces ultra-compact function signatures:

```markdown
# Tools

- `get_weather(location: string, units?: string)` — Get current weather for a location
- `create_issue(owner: string, repo: string, title: string, body?: string, labels?: string[])` — Create a GitHub issue
```

Benchmarked savings at scale:

| Scenario | JSON tokens | Markdown (table) | Markdown (signatures) |
| --- | --- | --- | --- |
| 10 tools | 1,984 | 934 (−53%) | 374 (−81%) |
| 35 tools (3 servers) | 6,053 | 2,824 (−53%) | 1,111 (−82%) |
| 58 tools (Anthropic's reported case) | ~55,000 | ~4,500 (−92%) | ~1,800 (−97%) |

---

## Additional Triggers

Beyond the file extension, the middleware also responds to standard content negotiation:

| Trigger | Example |
| --- | --- |
| Extension | `GET /api/users.jsonmd` |
| Accept header | `Accept: text/markdown` |
| Query parameter | `GET /api/users?format=md` |
| Custom header | `X-Format: markdown` |

---

## Response Headers

Every converted response includes token statistics:

```
Content-Type: text/markdown; charset=utf-8
X-Converted-By: json.md
X-Token-JSON: 1460
X-Token-Markdown: 644
X-Token-Savings: 55.9%
```

---

## Programmatic Use

The core converter works standalone without any framework:

**JavaScript:**

```js
import { jsonToMd, smartConvert, estimateTokens } from 'jsonmd';

const md = jsonToMd(data, 'Users');
const md2 = smartConvert(mcpToolsResponse, { mode: 'signatures' });
```

**Python:**

```python
from jsonmd import json_to_md, smart_convert, estimate_tokens

md = json_to_md(data, title="Users")
md2 = smart_convert(mcp_tools, mode="signatures")
```

**CLI:**

```bash
echo '[{"id":1,"name":"Alice"}]' | jsonmd
echo '[{"id":1,"name":"Alice"}]' | jsonmd --title Users
cat mcp_tools.json | jsonmd --mode signatures
jsonmd bench data.json
```

---

## Round-Trip

Convert Markdown back to JSON:

```python
from jsonmd import json_to_md, md_to_json

md = json_to_md([{"id": 1, "name": "Alice"}])
data = md_to_json(md)  # [{"id": 1, "name": "Alice"}]
```

---

## Token Savings by Data Shape

| Data shape | Rows | vs Pretty JSON | vs Compact JSON |
| --- | --- | --- | --- |
| Flat table (5 cols) | 50 | **−55.9%** | **−36.2%** |
| Flat table (5 cols) | 3 | −39.7% | −5.0% |
| Mixed nested | 2 | −15.3% | +38.5% |
| Small key-value | — | +37.5% | +69.2% |

jsonmd shines on tabular data — arrays of objects with consistent keys. This is the majority of what gets stuffed into LLM prompts: database rows, API results, RAG context, few-shot examples.

For small nested configs, compact JSON may be more efficient. jsonmd doesn't force conversion — it only converts when you ask for it via the extension.

---

## Architecture Patterns

**Dual-purpose API** — serve humans and LLMs from the same routes:

```
GET /api/users              → JSON (frontend, mobile)
GET /api/users.jsonmd       → Markdown (agents, RAG)
```

**LLM proxy** — sit in front of any third-party API:

```bash
TARGET=https://api.github.com jsonmd-proxy --port 3001
# Now: GET http://localhost:3001/repos/user/repo.jsonmd
```

**MCP optimization** — compress tool definitions before context injection:

```js
import { mcpToMd } from 'jsonmd';

const tools = await mcpClient.listTools();
systemPrompt += '\n' + mcpToMd(tools, 'signatures');
```

---

## Comparison

| | jsonmd | TOON | JSON | YAML |
| --- | --- | --- | --- | --- |
| Token savings | 15–55% | 30–60% | 0% | 10–15% |
| LLM accuracy (independent tests) | 52–62% | 43–47% | 50–62% | 52–62% |
| Adoption barrier | Zero | New spec | None | Indentation |
| LLM output generation | Native | Unreliable | Supported | Unreliable |
| MCP compression | Built-in | Not applicable | N/A | N/A |
| Integration | 1 line | SDK per language | Already there | Manual |

---

## Monorepo Structure

```
packages/
  core-js/          ← npm: jsonmd
  core-python/      ← pypi: jsonmd
  cli/              ← npm: @jsonmd/cli
spec/
  SPEC.md           ← Conversion rules (source of truth)
benchmarks/
  fixtures/         ← Shared test fixtures
examples/
  express/
  hono/
  fastapi/
  proxy/
```

Both JS and Python implementations conform to the same spec (`spec/SPEC.md`) and produce identical output for the same input.

---

## Name

`jsonmd` is the repo name, the npm/PyPI package name, the middleware function name, and the file extension. One word everywhere.

```
github.com/jsonmd/jsonmd
npmjs.com/package/jsonmd
pypi.org/project/jsonmd
/api/users.jsonmd
import { jsonmd } from 'jsonmd'
from jsonmd import enable
```

---

## License

MIT
