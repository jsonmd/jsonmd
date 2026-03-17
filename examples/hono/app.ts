import { Hono } from 'hono';
import { jsonmdHono } from 'jsonmd';

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

export default app;
