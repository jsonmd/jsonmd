import { describe, it, expect } from 'vitest';
import { estimateTokens } from '../src/tokens.js';

describe('estimateTokens', () => {
  it('returns ceil(length/4)', () => {
    expect(estimateTokens('')).toBe(0);
    expect(estimateTokens('a')).toBe(1);
    expect(estimateTokens('abcd')).toBe(1);
    expect(estimateTokens('abcde')).toBe(2);
    expect(estimateTokens('hello world')).toBe(3); // 11 chars → ceil(11/4) = 3
  });

  it('handles long strings', () => {
    const str = 'a'.repeat(1000);
    expect(estimateTokens(str)).toBe(250);
  });
});
