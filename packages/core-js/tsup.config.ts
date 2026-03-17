import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/cli.ts',
    'src/proxy.ts',
  ],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  splitting: true,
  target: 'node18',
  external: ['express', 'hono'],
  banner({ format }) {
    if (format === 'esm') {
      return {};
    }
    return {};
  },
});
