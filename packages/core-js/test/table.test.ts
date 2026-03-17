import { describe, it, expect } from 'vitest';
import { toTable, toKeyValueTable, toBulletList, isPrimitive, isFlat } from '../src/table.js';

describe('toTable', () => {
  it('converts array of flat objects to table', () => {
    const result = toTable([
      { id: 1, name: 'Alice', role: 'admin' },
      { id: 2, name: 'Bob', role: 'editor' },
    ]);
    expect(result).toBe(
      '| id | name | role |\n| --- | --- | --- |\n| 1 | Alice | admin |\n| 2 | Bob | editor |',
    );
  });

  it('handles missing keys across rows', () => {
    const result = toTable([{ a: 1, b: 2 }, { a: 3, c: 4 }]);
    expect(result).toContain('| a | b | c |');
    expect(result).toContain('| 1 | 2 |  |');
    expect(result).toContain('| 3 |  | 4 |');
  });

  it('escapes pipe characters', () => {
    const result = toTable([{ cmd: 'a | b' }]);
    expect(result).toContain('a \\| b');
  });

  it('replaces newlines with space', () => {
    const result = toTable([{ text: 'line1\nline2' }]);
    expect(result).toContain('line1 line2');
  });

  it('handles empty array', () => {
    expect(toTable([])).toBe('');
  });

  it('handles null and boolean values', () => {
    const result = toTable([{ a: null, b: true, c: false }]);
    expect(result).toContain('|  | true | false |');
  });
});

describe('toKeyValueTable', () => {
  it('converts flat object to key-value table', () => {
    const result = toKeyValueTable({ name: 'Alice', role: 'admin' });
    expect(result).toBe(
      '| Key | Value |\n| --- | --- |\n| name | Alice |\n| role | admin |',
    );
  });

  it('handles empty object', () => {
    expect(toKeyValueTable({})).toBe('');
  });
});

describe('toBulletList', () => {
  it('converts primitives to bullet list', () => {
    expect(toBulletList(['a', 'b', 'c'])).toBe('- a\n- b\n- c');
  });

  it('handles numbers and booleans', () => {
    expect(toBulletList([1, true, null])).toBe('- 1\n- true\n- ');
  });
});

describe('isPrimitive', () => {
  it('detects primitives', () => {
    expect(isPrimitive('str')).toBe(true);
    expect(isPrimitive(42)).toBe(true);
    expect(isPrimitive(true)).toBe(true);
    expect(isPrimitive(null)).toBe(true);
    expect(isPrimitive({})).toBe(false);
    expect(isPrimitive([])).toBe(false);
  });
});

describe('isFlat', () => {
  it('detects flat objects', () => {
    expect(isFlat({ a: 1, b: 'x', c: null })).toBe(true);
    expect(isFlat({ a: 1, b: { nested: true } })).toBe(false);
    expect(isFlat({ a: 1, b: [1, 2] })).toBe(false);
  });
});
