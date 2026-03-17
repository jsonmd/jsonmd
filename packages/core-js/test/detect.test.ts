import { describe, it, expect } from 'vitest';
import { detectRequest } from '../src/detect.js';

describe('detectRequest', () => {
  describe('URL extension', () => {
    it('detects .jsonmd', () => {
      const result = detectRequest('/api/users.jsonmd');
      expect(result.shouldConvert).toBe(true);
      expect(result.cleanUrl).toBe('/api/users');
    });

    it('detects .json.md', () => {
      const result = detectRequest('/api/users.json.md');
      expect(result.shouldConvert).toBe(true);
      expect(result.cleanUrl).toBe('/api/users');
    });

    it('detects .md', () => {
      const result = detectRequest('/api/users.md');
      expect(result.shouldConvert).toBe(true);
      expect(result.cleanUrl).toBe('/api/users');
    });

    it('preserves query parameters', () => {
      const result = detectRequest('/api/users.jsonmd?page=2&limit=10');
      expect(result.shouldConvert).toBe(true);
      expect(result.cleanUrl).toBe('/api/users?page=2&limit=10');
    });

    it('does not trigger on normal URLs', () => {
      const result = detectRequest('/api/users');
      expect(result.shouldConvert).toBe(false);
    });
  });

  describe('Accept header', () => {
    it('detects text/markdown', () => {
      const result = detectRequest('/api/users', { accept: 'text/markdown' });
      expect(result.shouldConvert).toBe(true);
    });

    it('detects text/markdown in mixed accept', () => {
      const result = detectRequest('/api/users', {
        accept: 'application/json, text/markdown',
      });
      expect(result.shouldConvert).toBe(true);
    });
  });

  describe('query parameter', () => {
    it('detects format=md', () => {
      const result = detectRequest('/api/users?format=md');
      expect(result.shouldConvert).toBe(true);
      expect(result.cleanUrl).toBe('/api/users');
    });

    it('detects format=markdown', () => {
      const result = detectRequest('/api/users?format=markdown&page=2');
      expect(result.shouldConvert).toBe(true);
      expect(result.cleanUrl).toBe('/api/users?page=2');
    });
  });

  describe('X-Format header', () => {
    it('detects X-Format: markdown', () => {
      const result = detectRequest('/api/users', { 'x-format': 'markdown' });
      expect(result.shouldConvert).toBe(true);
    });
  });

  describe('mode detection', () => {
    it('detects mode=signatures from query', () => {
      const result = detectRequest('/api/tools.jsonmd?mode=signatures');
      expect(result.shouldConvert).toBe(true);
      expect(result.mode).toBe('signatures');
    });
  });
});
