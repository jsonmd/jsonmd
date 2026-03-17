import type { Request, Response, NextFunction } from 'express';
import type { JsonmdOptions } from './types.js';
import { smartConvert } from './convert.js';
import { estimateTokens } from './tokens.js';
import { detectRequest } from './detect.js';

/**
 * Express middleware that converts JSON responses to Markdown
 * when the URL ends with .jsonmd, .json.md, or .md.
 */
export function jsonmd(opts?: JsonmdOptions) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const detect = detectRequest(req.originalUrl || req.url, req.headers as Record<string, string>);

    if (!detect.shouldConvert) {
      next();
      return;
    }

    // Rewrite URL so downstream routes match
    const cleanUrl = detect.cleanUrl;
    req.url = cleanUrl;
    if (req.originalUrl) {
      Object.defineProperty(req, 'originalUrl', { value: cleanUrl, writable: true });
    }

    // Merge mode from URL detection with options
    const mergedOpts: JsonmdOptions = {
      ...opts,
      ...(detect.mode ? { mode: detect.mode } : {}),
    };

    // Monkey-patch res.json to intercept the response
    const originalJson = res.json.bind(res);
    res.json = function jsonmdOverride(body: unknown): Response {
      const md = smartConvert(body, mergedOpts);
      const jsonStr = JSON.stringify(body);
      const tokenJson = estimateTokens(jsonStr);
      const tokenMd = estimateTokens(md);
      const savings = tokenJson > 0 ? ((1 - tokenMd / tokenJson) * 100).toFixed(1) : '0.0';

      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      res.setHeader('X-Converted-By', 'jsonmd');
      if (mergedOpts.headers !== false) {
        res.setHeader('X-Token-JSON', String(tokenJson));
        res.setHeader('X-Token-Markdown', String(tokenMd));
        res.setHeader('X-Token-Savings', `${savings}%`);
      }

      return res.send(md);
    };

    next();
  };
}
