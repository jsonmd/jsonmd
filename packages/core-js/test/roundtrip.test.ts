import { describe, it, expect } from 'vitest';
import { mdToJson } from '../src/roundtrip.js';
import { smartConvert } from '../src/convert.js';

describe('mdToJson', () => {
  it('parses a simple table', () => {
    const md = '| id | name |\n| --- | --- |\n| 1 | Alice |\n| 2 | Bob |';
    const result = mdToJson(md);
    expect(result).toEqual([
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ]);
  });

  it('parses key-value table back to object', () => {
    const md = '| Key | Value |\n| --- | --- |\n| name | Alice |\n| role | admin |';
    const result = mdToJson(md);
    expect(result).toEqual({ name: 'Alice', role: 'admin' });
  });

  it('coerces types', () => {
    const md = '| a | b | c | d |\n| --- | --- | --- | --- |\n| 42 | true | false |  |';
    const result = mdToJson(md) as Record<string, unknown>[];
    expect(result[0]).toEqual({ a: 42, b: true, c: false, d: null });
  });

  it('handles escaped pipes', () => {
    const md = '| cmd |\n| --- |\n| a \\| b |';
    const result = mdToJson(md) as Record<string, unknown>[];
    expect(result[0].cmd).toBe('a | b');
  });

  it('returns null for non-table input', () => {
    expect(mdToJson('just some text')).toBeNull();
    expect(mdToJson('')).toBeNull();
  });

  it('round-trips array of flat objects', () => {
    const original = [
      { id: 1, name: 'Alice', role: 'admin' },
      { id: 2, name: 'Bob', role: 'editor' },
    ];
    const md = smartConvert(original);
    const parsed = mdToJson(md);
    expect(parsed).toEqual(original);
  });

  it('round-trips flat object', () => {
    const original = { name: 'Alice', role: 'admin', active: true };
    const md = smartConvert(original);
    const parsed = mdToJson(md);
    expect(parsed).toEqual(original);
  });
});
