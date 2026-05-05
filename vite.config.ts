import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import manifest from './manifest.json';

export default defineConfig({
  build: {
    cssMinify: 'esbuild',
    rollupOptions: {
      input: {
        index: path.resolve(process.cwd(), 'src/newtab/index.html'),
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    crx({ manifest }),
  ],
});
