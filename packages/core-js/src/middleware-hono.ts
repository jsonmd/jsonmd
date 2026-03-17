import type { JsonmdOptions } from './types.js';
import { smartConvert } from './convert.js';
import { estimateTokens } from './tokens.js';
import { detectRequest } from './detect.js';

// Use a flag header to prevent infinite recursion
const INTERNAL_HEADER = 'x-jsonmd-internal';

/**
 * Hono middleware that converts JSON responses to Markdown
 * when the URL ends with .jsonmd, .json.md, or .md.
 *
 * Pass the Hono app instance so the middleware can re-route
 * requests with the extension stripped:
 *
 * ```ts
 * const app = new Hono();
 * app.use('*', jsonmdHono({ app }));
 * ```
 */
export function jsonmdHono(opts?: JsonmdOptions & { app?: { fetch: (req: Request) => Promise<Response> } }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (c: any, next: () => Promise<void>): Promise<Response | void> => {
    // Skip if this is an internal re-fetch
    if (c.req.header(INTERNAL_HEADER)) {
      await next();
      return;
    }

    const headers: Record<string, string> = {};
    c.req.raw.headers.forEach((v: string, k: string) => {
      headers[k] = v;
    });

    const detect = detectRequest(c.req.path, headers);

    if (!detect.shouldConvert) {
      await next();
      return;
    }

    const mergedOpts: JsonmdOptions = {
      ...opts,
      ...(detect.mode ? { mode: detect.mode } : {}),
    };

    // Build clean URL
    const origUrl = new URL(c.req.url);
    const cleanParts = detect.cleanUrl.split('?');
    origUrl.pathname = cleanParts[0];
    origUrl.search = cleanParts[1] ? `?${cleanParts[1]}` : '';

    // Get the app reference for re-routing
    const app = opts?.app;

    let response: Response;
    if (app && typeof app.fetch === 'function') {
      // Re-fetch through the app with the clean URL
      const cleanHeaders = new Headers(c.req.raw.headers);
      cleanHeaders.set(INTERNAL_HEADER, '1');
      const cleanReq = new Request(origUrl.href, {
        method: c.req.raw.method,
        headers: cleanHeaders,
      });
      response = await app.fetch(cleanReq);
    } else {
      // No app reference: fall through to next middleware
      // This works for Accept header / query param triggers where the URL doesn't change
      await next();
      response = c.res;
    }

    // Check if response is JSON
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json') && !contentType.includes('text/json')) {
      if (app) return response;
      return;
    }

    const body = await response.json();
    const md = smartConvert(body, mergedOpts);
    const jsonStr = JSON.stringify(body);
    const tokenJson = estimateTokens(jsonStr);
    const tokenMd = estimateTokens(md);
    const savings = tokenJson > 0 ? ((1 - tokenMd / tokenJson) * 100).toFixed(1) : '0.0';

    const responseHeaders: Record<string, string> = {
      'Content-Type': 'text/markdown; charset=utf-8',
      'X-Converted-By': 'jsonmd',
    };
    if (mergedOpts.headers !== false) {
      responseHeaders['X-Token-JSON'] = String(tokenJson);
      responseHeaders['X-Token-Markdown'] = String(tokenMd);
      responseHeaders['X-Token-Savings'] = `${savings}%`;
    }

    return c.newResponse(md, response.status, responseHeaders);
  };
}
