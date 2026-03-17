import { describe, it, expect } from 'vitest';
import { smartConvert, jsonToMd } from '../src/convert.js';

describe('smartConvert', () => {
  it('converts array of flat objects to table', () => {
    const data = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ];
    const md = smartConvert(data);
    expect(md).toContain('| id | name |');
    expect(md).toContain('| 1 | Alice |');
    expect(md).toContain('| 2 | Bob |');
  });

  it('converts flat object to key-value table', () => {
    const md = smartConvert({ name: 'Alice', role: 'admin' });
    expect(md).toContain('| Key | Value |');
    expect(md).toContain('| name | Alice |');
  });

  it('converts array of primitives to bullet list', () => {
    const md = smartConvert(['ts', 'py', 'rs']);
    expect(md).toBe('- ts\n- py\n- rs');
  });

  it('converts nested object to headings', () => {
    const md = smartConvert({
      user: { name: 'Alice', role: 'admin' },
      settings: { theme: 'dark' },
    });
    expect(md).toContain('## user');
    expect(md).toContain('## settings');
    expect(md).toContain('| name | Alice |');
  });

  it('handles empty inputs', () => {
    expect(smartConvert(null)).toBe('');
    expect(smartConvert({})).toBe('');
    expect(smartConvert([])).toBe('');
  });

  it('handles primitives', () => {
    expect(smartConvert(42 as unknown)).toBe('42');
    expect(smartConvert('hello' as unknown)).toBe('hello');
    expect(smartConvert(true as unknown)).toBe('true');
  });

  it('adds title when provided', () => {
    const md = smartConvert([{ id: 1 }], { title: 'Users' });
    expect(md.startsWith('# Users\n')).toBe(true);
    expect(md).toContain('| id |');
  });

  it('detects MCP tool list', () => {
    const data = {
      tools: [
        {
          name: 'get_weather',
          description: 'Get weather',
          inputSchema: {
            type: 'object',
            properties: {
              location: { type: 'string', description: 'City' },
            },
            required: ['location'],
          },
        },
      ],
    };
    const md = smartConvert(data);
    expect(md).toContain('# Tools');
    expect(md).toContain('get_weather');
  });

  it('respects maxDepth', () => {
    const deep = { a: { b: { c: { d: 'value' } } } };
    const md = smartConvert(deep, { maxDepth: 2 });
    expect(md).toContain('`');
  });
});

describe('jsonToMd', () => {
  it('is an alias for smartConvert with title', () => {
    const md = jsonToMd([{ id: 1 }], 'Test');
    expect(md).toContain('# Test');
    expect(md).toContain('| id |');
  });
});
