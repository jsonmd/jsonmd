import type { JsonmdOptions, JsonValue } from './types.js';
import { toTable, toKeyValueTable, toBulletList, isPrimitive, isFlat } from './table.js';
import { isMcpToolList, mcpToMd } from './mcp.js';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function renderNested(data: unknown, depth: number, maxDepth: number): string {
  if (depth > maxDepth) {
    return '`' + JSON.stringify(data) + '`';
  }

  if (data === null || data === undefined) return '';
  if (isPrimitive(data)) return String(data);

  if (Array.isArray(data)) {
    if (data.length === 0) return '';

    // Array of primitives
    if (data.every(isPrimitive)) {
      return toBulletList(data);
    }

    // Array of flat objects
    if (data.every((item) => isObject(item) && isFlat(item as Record<string, unknown>))) {
      return toTable(data as Record<string, unknown>[]);
    }

    // Array of objects (possibly with nested values) - still try table if mostly flat
    if (data.every(isObject)) {
      const flatCount = data.filter((item) => isFlat(item as Record<string, unknown>)).length;
      if (flatCount / data.length >= 0.8) {
        return toTable(data as Record<string, unknown>[]);
      }
    }

    // Mixed/nested array - render indexed sections
    const sections: string[] = [];
    const heading = '#'.repeat(Math.min(depth + 1, 6));
    for (let i = 0; i < data.length; i++) {
      sections.push(`${heading} [${i}]\n\n${renderNested(data[i], depth + 1, maxDepth)}`);
    }
    return sections.join('\n\n');
  }

  if (isObject(data)) {
    const obj = data as Record<string, unknown>;
    const entries = Object.entries(obj);
    if (entries.length === 0) return '';

    // Flat object
    if (isFlat(obj)) {
      return toKeyValueTable(obj);
    }

    // Nested object - headings + recursion
    const sections: string[] = [];
    const heading = '#'.repeat(Math.min(depth + 1, 6));
    for (const [key, value] of entries) {
      if (isPrimitive(value)) {
        sections.push(`${heading} ${key}\n\n${value === null ? '' : String(value)}`);
      } else {
        sections.push(`${heading} ${key}\n\n${renderNested(value, depth + 1, maxDepth)}`);
      }
    }
    return sections.join('\n\n');
  }

  return String(data);
}

/**
 * Smart convert JSON data to Markdown, auto-detecting the best representation.
 */
export function smartConvert(data: unknown, opts?: JsonmdOptions): string {
  const maxDepth = opts?.maxDepth ?? 6;
  const mode = opts?.mode ?? 'table';

  // Check MCP first
  if (isMcpToolList(data)) {
    return mcpToMd(data, mode);
  }

  const parts: string[] = [];

  if (opts?.title) {
    parts.push(`# ${opts.title}`);
    parts.push('');
  }

  const body = renderNested(data, 1, maxDepth);
  if (body) parts.push(body);

  return parts.join('\n');
}

/**
 * Alias for smartConvert with title support.
 */
export function jsonToMd(data: unknown, title?: string): string {
  return smartConvert(data, title ? { title } : undefined);
}
