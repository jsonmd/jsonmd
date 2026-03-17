import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { jsonmd } from '../src/middleware-express.js';

function createApp() {
  const app = express();
  app.use(jsonmd());

  app.get('/api/users', (_req, res) => {
    res.json([
      { id: 1, name: 'Alice', role: 'admin' },
      { id: 2, name: 'Bob', role: 'editor' },
    ]);
  });

  app.get('/api/config', (_req, res) => {
    res.json({ theme: 'dark', lang: 'en' });
  });

  app.get('/api/tags', (_req, res) => {
    res.json(['typescript', 'python', 'rust']);
  });

  return app;
}

describe('Express middleware', () => {
  const app = createApp();

  it('passes through normal JSON requests', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/json');
    expect(res.body).toHaveLength(2);
  });

  it('converts .jsonmd to markdown table', async () => {
    const res = await request(app).get('/api/users.jsonmd');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/markdown');
    expect(res.text).toContain('| id | name | role |');
    expect(res.text).toContain('| 1 | Alice | admin |');
    expect(res.text).toContain('| 2 | Bob | editor |');
  });

  it('sets token headers', async () => {
    const res = await request(app).get('/api/users.jsonmd');
    expect(res.headers['x-converted-by']).toBe('jsonmd');
    expect(res.headers['x-token-json']).toBeDefined();
    expect(res.headers['x-token-markdown']).toBeDefined();
    expect(res.headers['x-token-savings']).toMatch(/\d+\.\d+%/);
  });

  it('converts .md extension', async () => {
    const res = await request(app).get('/api/users.md');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/markdown');
    expect(res.text).toContain('| id | name | role |');
  });

  it('converts .json.md extension', async () => {
    const res = await request(app).get('/api/users.json.md');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/markdown');
  });

  it('converts via Accept header', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Accept', 'text/markdown');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/markdown');
    expect(res.text).toContain('| id | name | role |');
  });

  it('converts via format query param', async () => {
    const res = await request(app).get('/api/users?format=md');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/markdown');
  });

  it('converts via X-Format header', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('X-Format', 'markdown');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/markdown');
  });

  it('converts flat object to key-value table', async () => {
    const res = await request(app).get('/api/config.jsonmd');
    expect(res.text).toContain('| Key | Value |');
    expect(res.text).toContain('| theme | dark |');
  });

  it('converts array of primitives to bullet list', async () => {
    const res = await request(app).get('/api/tags.jsonmd');
    expect(res.text).toContain('- typescript');
    expect(res.text).toContain('- python');
    expect(res.text).toContain('- rust');
  });
});
