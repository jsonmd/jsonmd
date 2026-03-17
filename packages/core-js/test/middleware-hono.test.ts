import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import { jsonmdHono } from '../src/middleware-hono.js';

function createApp() {
  const app = new Hono();
  app.use('*', jsonmdHono({ app }));

  app.get('/api/users', (c) => {
    return c.json([
      { id: 1, name: 'Alice', role: 'admin' },
      { id: 2, name: 'Bob', role: 'editor' },
    ]);
  });

  app.get('/api/config', (c) => {
    return c.json({ theme: 'dark', lang: 'en' });
  });

  return app;
}

describe('Hono middleware', () => {
  const app = createApp();

  it('passes through normal JSON requests', async () => {
    const res = await app.request('/api/users');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/json');
    const body = await res.json();
    expect(body).toHaveLength(2);
  });

  it('converts .jsonmd to markdown table', async () => {
    const res = await app.request('/api/users.jsonmd');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/markdown');
    const text = await res.text();
    expect(text).toContain('| id | name | role |');
    expect(text).toContain('| 1 | Alice | admin |');
  });

  it('sets token headers', async () => {
    const res = await app.request('/api/users.jsonmd');
    expect(res.headers.get('x-converted-by')).toBe('jsonmd');
    expect(res.headers.get('x-token-json')).toBeDefined();
    expect(res.headers.get('x-token-markdown')).toBeDefined();
    expect(res.headers.get('x-token-savings')).toMatch(/\d+\.\d+%/);
  });

  it('converts via Accept header', async () => {
    const res = await app.request('/api/users', {
      headers: { Accept: 'text/markdown' },
    });
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/markdown');
  });

  it('converts flat object to key-value table', async () => {
    const res = await app.request('/api/config.jsonmd');
    const text = await res.text();
    expect(text).toContain('| Key | Value |');
    expect(text).toContain('| theme | dark |');
  });
});
