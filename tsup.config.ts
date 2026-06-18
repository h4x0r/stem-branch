import { defineConfig } from 'tsup';

export default defineConfig([
  // Library build
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: false,
    clean: true,
    splitting: false,
  },
  // CLI build
  {
    entry: ['src/cli.ts'],
    format: ['cjs'],
    sourcemap: false,
    banner: { js: '#!/usr/bin/env node' },
    splitting: false,
    noExternal: [/(.*)/],
  },
]);
