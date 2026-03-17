export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export interface JsonmdOptions {
  /** MCP output mode: 'table' (default) or 'signatures' */
  mode?: 'table' | 'signatures';
  /** Maximum recursion depth for nested objects (default: 6) */
  maxDepth?: number;
  /** Optional title rendered as # heading */
  title?: string;
  /** Whether to include X-Token-* response headers (default: true) */
  headers?: boolean;
}

export interface ConvertResult {
  markdown: string;
  tokenJson: number;
  tokenMarkdown: number;
  savings: string;
}

export interface DetectResult {
  shouldConvert: boolean;
  cleanUrl: string;
  mode?: 'table' | 'signatures';
}

export interface McpTool {
  name: string;
  description?: string;
  inputSchema?: McpSchema;
  parameters?: McpSchema;
}

export interface McpSchema {
  type?: string;
  properties?: Record<string, McpProperty>;
  required?: string[];
}

export interface McpProperty {
  type?: string | string[];
  description?: string;
  enum?: unknown[];
  items?: { type?: string };
}
