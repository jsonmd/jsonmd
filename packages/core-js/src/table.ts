import type { JsonPrimitive, JsonValue } from './types.js';

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  return str.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return String(value);
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}

/**
 * Convert an array of flat objects to a Markdown table.
 */
export function toTable(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';

  // Collect union of keys in first-occurrence order
  const keySet = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      keySet.add(key);
    }
  }
  const keys = Array.from(keySet);

  const lines: string[] = [];

  // Header
  lines.push('| ' + keys.join(' | ') + ' |');
  // Separator
  lines.push('| ' + keys.map(() => '---').join(' | ') + ' |');
  // Data rows
  for (const row of rows) {
    const cells = keys.map((k) => escapeCell(formatValue(row[k])));
    lines.push('| ' + cells.join(' | ') + ' |');
  }

  return lines.join('\n');
}

/**
 * Convert a flat object to a 2-column Key | Value table.
 */
export function toKeyValueTable(obj: Record<string, unknown>): string {
  const entries = Object.entries(obj);
  if (entries.length === 0) return '';

  const lines: string[] = [];
  lines.push('| Key | Value |');
  lines.push('| --- | --- |');

  for (const [key, value] of entries) {
    lines.push(`| ${escapeCell(key)} | ${escapeCell(formatValue(value))} |`);
  }

  return lines.join('\n');
}

/**
 * Convert an array of primitives to a bullet list.
 */
export function toBulletList(items: JsonPrimitive[]): string {
  return items.map((item) => `- ${formatValue(item)}`).join('\n');
}

/**
 * Check if a value is a primitive (string, number, boolean, null).
 */
export function isPrimitive(value: unknown): value is JsonPrimitive {
  return value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}

/**
 * Check if an object has only primitive values.
 */
export function isFlat(obj: Record<string, unknown>): boolean {
  return Object.values(obj).every(isPrimitive);
}
