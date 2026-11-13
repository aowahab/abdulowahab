import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync } from 'node:fs';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react(), {
    name: 'preserve-legacy-admin',
    closeBundle() { copyFileSync(resolve('admin.js'), resolve('dist/admin.js')); }
  }],
  build: { rollupOptions: { input: { main: resolve('index.html'), admin: resolve('admin.html') } } }
});
