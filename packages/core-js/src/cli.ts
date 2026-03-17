#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { smartConvert } from './convert.js';
import { estimateTokens } from './tokens.js';
import type { JsonmdOptions } from './types.js';

function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    process.stdin.on('data', (chunk) => chunks.push(chunk));
    process.stdin.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    process.stdin.on('error', reject);
  });
}

function usage(): void {
  console.log(`Usage:
  echo '{"key":"value"}' | jsonmd            Pipe JSON, output Markdown
  jsonmd <file.json>                         Convert a JSON file
  jsonmd bench <file.json>                   Show token comparison
  jsonmd --help                              Show this help

Options:
  --title <title>         Add a title heading
  --mode <table|signatures>  MCP output mode (default: table)`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    usage();
    return;
  }

  // Parse flags
  const opts: JsonmdOptions = {};
  const positional: string[] = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--title' && i + 1 < args.length) {
      opts.title = args[++i];
    } else if (args[i] === '--mode' && i + 1 < args.length) {
      const mode = args[++i];
      if (mode === 'table' || mode === 'signatures') {
        opts.mode = mode;
      }
    } else {
      positional.push(args[i]);
    }
  }

  const isBench = positional[0] === 'bench';
  const filePath = isBench ? positional[1] : positional[0];

  // Read input
  let input: string;
  if (filePath) {
    input = readFileSync(filePath, 'utf-8');
  } else if (!process.stdin.isTTY) {
    input = await readStdin();
  } else {
    usage();
    process.exit(1);
  }

  const data = JSON.parse(input);

  if (isBench) {
    // Bench mode: show token comparison
    const md = smartConvert(data, opts);
    const prettyJson = JSON.stringify(data, null, 2);
    const compactJson = JSON.stringify(data);

    const tokPretty = estimateTokens(prettyJson);
    const tokCompact = estimateTokens(compactJson);
    const tokMd = estimateTokens(md);

    const savingsVsPretty = ((1 - tokMd / tokPretty) * 100).toFixed(1);
    const savingsVsCompact = ((1 - tokMd / tokCompact) * 100).toFixed(1);

    console.log('Token Comparison:');
    console.log(`  Pretty JSON:  ${tokPretty} tokens`);
    console.log(`  Compact JSON: ${tokCompact} tokens`);
    console.log(`  Markdown:     ${tokMd} tokens`);
    console.log(`  vs Pretty:    ${savingsVsPretty}%`);
    console.log(`  vs Compact:   ${savingsVsCompact}%`);
    console.log('');
    console.log('Markdown output:');
    console.log(md);
  } else {
    // Normal mode: output markdown
    process.stdout.write(smartConvert(data, opts));
    if (process.stdout.isTTY) process.stdout.write('\n');
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
