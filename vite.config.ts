import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import pkg from './package.json' with { type: 'json' };

const externals = [
  ...Object.keys(pkg.peerDependencies),
  'react/jsx-runtime',
  'react/jsx-dev-runtime',
];

/**
 * Library build.
 *
 * - ESM only, one output file per source module (`preserveModules`) so
 *   bundlers can tree-shake unused components.
 * - React is external (peer dependency) and never bundled.
 * - Styles are NOT emitted here: `pnpm build:css` compiles the SCSS entry
 *   points into `dist/styles.css` and `dist/base.css` so consumers import
 *   them explicitly.
 * - Every module gets a `"use client"` banner so the components can be
 *   imported from React Server Components (Next.js App Router, etc.).
 */
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    sourcemap: true,
    minify: false,
    target: 'es2022',
    lib: {
      entry: resolve(import.meta.dirname, 'src/index.ts'),
      formats: ['es'],
    },
    rollupOptions: {
      external: (id) => externals.some((dep) => id === dep || id.startsWith(`${dep}/`)),
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
        entryFileNames: '[name].js',
        banner: (chunk) => (chunk.isEntry || chunk.type === 'chunk' ? '"use client";' : ''),
      },
    },
  },
});
