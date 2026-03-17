#!/usr/bin/env node

import { createServer } from 'node:http';
import { smartConvert } from './convert.js';
import { estimateTokens } from './tokens.js';
import { detectRequest } from './detect.js';
import type { JsonmdOptions } from './types.js';

function parseArgs(): { port: number; target: string } {
  const args = process.argv.slice(2);
  let port = 3001;
  const target = process.env.TARGET || 'http://localhost:3000';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--port' && i + 1 < args.length) {
      port = parseInt(args[++i], 10);
    }
  }

  return { port, target };
}

function main(): void {
  const { port, target } = parseArgs();

  const server = createServer(async (req, res) => {
    const url = req.url || '/';
    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (typeof value === 'string') headers[key] = value;
      else if (Array.isArray(value)) headers[key] = value[0];
    }

    const detect = detectRequest(url, headers);
    const targetUrl = new URL(detect.cleanUrl, target).href;

    try {
      // Forward request to target
      const proxyHeaders: Record<string, string> = { ...headers };
      delete proxyHeaders.host;

      const response = await fetch(targetUrl, {
        method: req.method,
        headers: proxyHeaders,
      });

      if (!detect.shouldConvert) {
        // Pass through
        res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
        const body = await response.arrayBuffer();
        res.end(Buffer.from(body));
        return;
      }

      // Convert JSON to markdown
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('json')) {
        // Not JSON, pass through
        res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
        const body = await response.arrayBuffer();
        res.end(Buffer.from(body));
        return;
      }

      const body = await response.json();
      const opts: JsonmdOptions = {
        ...(detect.mode ? { mode: detect.mode } : {}),
      };
      const md = smartConvert(body, opts);
      const jsonStr = JSON.stringify(body);
      const tokenJson = estimateTokens(jsonStr);
      const tokenMd = estimateTokens(md);
      const savings = tokenJson > 0 ? ((1 - tokenMd / tokenJson) * 100).toFixed(1) : '0.0';

      res.writeHead(200, {
        'Content-Type': 'text/markdown; charset=utf-8',
        'X-Converted-By': 'jsonmd',
        'X-Token-JSON': String(tokenJson),
        'X-Token-Markdown': String(tokenMd),
        'X-Token-Savings': `${savings}%`,
      });
      res.end(md);
    } catch (err) {
      res.writeHead(502, { 'Content-Type': 'text/plain' });
      res.end(`Proxy error: ${err instanceof Error ? err.message : String(err)}`);
    }
  });

  server.listen(port, () => {
    console.log(`jsonmd-proxy listening on :${port}`);
    console.log(`Proxying to ${target}`);
    console.log(`Try: curl http://localhost:${port}/api/endpoint.jsonmd`);
  });
}

main();
