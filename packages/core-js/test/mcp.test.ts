import { describe, it, expect } from 'vitest';
import { isMcpToolList, mcpToMd } from '../src/mcp.js';

const mcpData = {
  tools: [
    {
      name: 'get_weather',
      description: 'Get current weather for a location',
      inputSchema: {
        type: 'object',
        properties: {
          location: { type: 'string', description: 'City name or zip code' },
          units: { type: 'string', description: 'Temperature units (celsius, fahrenheit)' },
        },
        required: ['location'],
      },
    },
    {
      name: 'create_issue',
      description: 'Create a GitHub issue',
      inputSchema: {
        type: 'object',
        properties: {
          owner: { type: 'string', description: 'Repository owner' },
          repo: { type: 'string', description: 'Repository name' },
          title: { type: 'string', description: 'Issue title' },
          body: { type: 'string', description: 'Issue body' },
        },
        required: ['owner', 'repo', 'title'],
      },
    },
  ],
};

describe('isMcpToolList', () => {
  it('detects MCP tool list', () => {
    expect(isMcpToolList(mcpData)).toBe(true);
  });

  it('rejects non-MCP data', () => {
    expect(isMcpToolList([])).toBe(false);
    expect(isMcpToolList({ tools: [] })).toBe(false);
    expect(isMcpToolList({ tools: [{ name: 'x' }] })).toBe(false);
    expect(isMcpToolList({ notTools: [] })).toBe(false);
    expect(isMcpToolList(null)).toBe(false);
    expect(isMcpToolList('string')).toBe(false);
  });

  it('accepts tools with parameters instead of inputSchema', () => {
    expect(
      isMcpToolList({
        tools: [{ name: 'x', parameters: { type: 'object', properties: {} } }],
      }),
    ).toBe(true);
  });
});

describe('mcpToMd', () => {
  describe('table mode', () => {
    it('renders summary table and parameter tables', () => {
      const md = mcpToMd(mcpData, 'table');
      expect(md).toContain('# Tools');
      expect(md).toContain('| Tool | Description |');
      expect(md).toContain('| get_weather | Get current weather for a location |');
      expect(md).toContain('| create_issue | Create a GitHub issue |');
      expect(md).toContain('## get_weather');
      expect(md).toContain('| Param | Type | Req | Description |');
      expect(md).toContain('| location | string | ✓ | City name or zip code |');
      expect(md).toContain('| units | string |  | Temperature units (celsius, fahrenheit) |');
    });
  });

  describe('signatures mode', () => {
    it('renders compact function signatures', () => {
      const md = mcpToMd(mcpData, 'signatures');
      expect(md).toContain('# Tools');
      expect(md).toContain(
        '`get_weather(location: string, units?: string)` — Get current weather for a location',
      );
      expect(md).toContain(
        '`create_issue(owner: string, repo: string, title: string, body?: string)` — Create a GitHub issue',
      );
    });
  });

  it('handles array types', () => {
    const data = {
      tools: [
        {
          name: 'test',
          description: 'Test tool',
          inputSchema: {
            type: 'object',
            properties: {
              tags: { type: 'array', items: { type: 'string' }, description: 'Tags' },
            },
            required: [],
          },
        },
      ],
    };
    const md = mcpToMd(data, 'signatures');
    expect(md).toContain('tags?: string[]');
  });
});
