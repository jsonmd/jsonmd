import type { DetectResult } from './types.js';

const EXTENSIONS = ['.jsonmd', '.json.md', '.md'];

/**
 * Detect if a request should be converted to Markdown.
 * Returns the clean URL (extension stripped, format param removed) and whether to convert.
 */
export function detectRequest(
  url: string,
  headers?: Record<string, string | string[] | undefined>,
): DetectResult {
  const headerGet = (name: string): string | undefined => {
    if (!headers) return undefined;
    const val = headers[name] ?? headers[name.toLowerCase()];
    return Array.isArray(val) ? val[0] : val;
  };

  // Parse URL
  let pathname: string;
  let search: string;
  try {
    // Handle both full URLs and path-only
    if (url.startsWith('http')) {
      const parsed = new URL(url);
      pathname = parsed.pathname;
      search = parsed.search;
    } else {
      const qIdx = url.indexOf('?');
      pathname = qIdx >= 0 ? url.slice(0, qIdx) : url;
      search = qIdx >= 0 ? url.slice(qIdx) : '';
    }
  } catch {
    return { shouldConvert: false, cleanUrl: url };
  }

  // 1. Check URL extension
  for (const ext of EXTENSIONS) {
    if (pathname.endsWith(ext)) {
      const cleanPath = pathname.slice(0, -ext.length);
      return {
        shouldConvert: true,
        cleanUrl: cleanPath + search,
        ...parseModeFromSearch(search),
      };
    }
  }

  // 2. Check Accept header
  const accept = headerGet('accept');
  if (accept && accept.includes('text/markdown')) {
    return {
      shouldConvert: true,
      cleanUrl: url,
      ...parseModeFromSearch(search),
    };
  }

  // 3. Check query parameter
  if (search) {
    const params = new URLSearchParams(search);
    const format = params.get('format');
    if (format === 'md' || format === 'markdown') {
      params.delete('format');
      const mode = params.get('mode') as 'table' | 'signatures' | null;
      if (mode) params.delete('mode');
      const remaining = params.toString();
      const cleanUrl = pathname + (remaining ? '?' + remaining : '');
      return {
        shouldConvert: true,
        cleanUrl,
        ...(mode ? { mode } : {}),
      };
    }
  }

  // 4. Check X-Format header
  const xFormat = headerGet('x-format');
  if (xFormat && xFormat.toLowerCase() === 'markdown') {
    return {
      shouldConvert: true,
      cleanUrl: url,
      ...parseModeFromSearch(search),
    };
  }

  return { shouldConvert: false, cleanUrl: url };
}

function parseModeFromSearch(search: string): { mode?: 'table' | 'signatures' } {
  if (!search) return {};
  const params = new URLSearchParams(search);
  const mode = params.get('mode');
  if (mode === 'signatures' || mode === 'table') return { mode };
  return {};
}
