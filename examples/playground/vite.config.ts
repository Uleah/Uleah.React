import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/** `pnpm dev` — a local sandbox that consumes the library straight from src/. */
export default defineConfig({
  root: import.meta.dirname,
  plugins: [react()],
  server: { port: 5173 },
});
