import express from 'express';
import { jsonmd } from 'jsonmd';

const app = express();
app.use(jsonmd());

app.get('/api/users', (_req, res) => {
  res.json([
    { id: 1, name: 'Alice', role: 'admin' },
    { id: 2, name: 'Bob', role: 'editor' },
  ]);
});

app.get('/api/config', (_req, res) => {
  res.json({ theme: 'dark', lang: 'en', notifications: true });
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
  console.log('Try: curl http://localhost:3000/api/users.jsonmd');
});
