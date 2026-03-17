import type { McpTool, McpSchema, McpProperty } from './types.js';

/**
 * Detect if a value is an MCP tool list response.
 */
export function isMcpToolList(data: unknown): data is { tools: McpTool[] } {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return false;
  const obj = data as Record<string, unknown>;
  if (!Array.isArray(obj.tools)) return false;
  const tools = obj.tools;
  if (tools.length === 0) return false;
  return tools.every(
    (t: unknown) =>
      typeof t === 'object' &&
      t !== null &&
      typeof (t as Record<string, unknown>).name === 'string' &&
      (typeof (t as Record<string, unknown>).inputSchema === 'object' ||
        typeof (t as Record<string, unknown>).parameters === 'object'),
  );
}

function getSchema(tool: McpTool): McpSchema {
  return tool.inputSchema || tool.parameters || {};
}

function typeStr(prop: McpProperty): string {
  if (Array.isArray(prop.type)) {
    return prop.type.join(' | ');
  }
  if (prop.type === 'array' && prop.items?.type) {
    return `${prop.items.type}[]`;
  }
  return prop.type || 'unknown';
}

/**
 * Convert MCP tool list to Markdown table format.
 */
function mcpToTable(tools: McpTool[]): string {
  const lines: string[] = [];

  // Summary table
  lines.push('# Tools');
  lines.push('');
  lines.push('| Tool | Description |');
  lines.push('| --- | --- |');
  for (const tool of tools) {
    lines.push(`| ${tool.name} | ${tool.description || ''} |`);
  }

  // Per-tool parameter tables
  for (const tool of tools) {
    const schema = getSchema(tool);
    const props = schema.properties;
    if (!props || Object.keys(props).length === 0) continue;

    const required = new Set(schema.required || []);

    lines.push('');
    lines.push(`## ${tool.name}`);
    lines.push('');
    if (tool.description) {
      lines.push(tool.description);
      lines.push('');
    }
    lines.push('| Param | Type | Req | Description |');
    lines.push('| --- | --- | --- | --- |');
    for (const [name, prop] of Object.entries(props)) {
      const req = required.has(name) ? '✓' : '';
      lines.push(`| ${name} | ${typeStr(prop)} | ${req} | ${prop.description || ''} |`);
    }
  }

  return lines.join('\n');
}

/**
 * Convert MCP tool list to compact function signatures.
 */
function mcpToSignatures(tools: McpTool[]): string {
  const lines: string[] = [];
  lines.push('# Tools');
  lines.push('');

  for (const tool of tools) {
    const schema = getSchema(tool);
    const props = schema.properties || {};
    const required = new Set(schema.required || []);

    const params: string[] = [];
    for (const [name, prop] of Object.entries(props)) {
      const optional = required.has(name) ? '' : '?';
      params.push(`${name}${optional}: ${typeStr(prop)}`);
    }

    const sig = `${tool.name}(${params.join(', ')})`;
    const desc = tool.description ? ` — ${tool.description}` : '';
    lines.push(`- \`${sig}\`${desc}`);
  }

  return lines.join('\n');
}

/**
 * Convert MCP tool list to Markdown.
 */
export function mcpToMd(data: { tools: McpTool[] }, mode: 'table' | 'signatures' = 'table'): string {
  return mode === 'signatures' ? mcpToSignatures(data.tools) : mcpToTable(data.tools);
}
