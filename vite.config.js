import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync, cpSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react(), {
    name: 'preserve-legacy-admin',
    closeBundle() {
      copyFileSync(resolve('admin.js'), resolve('dist/admin.js'));
      mkdirSync(resolve('dist/erp'), { recursive: true });
      for (const folder of ['cmaps','standard_fonts','wasm']) {
        mkdirSync(resolve('dist/vendor/pdfjs/'+folder), { recursive: true });
        cpSync(resolve('node_modules/pdfjs-dist/'+folder), resolve('dist/vendor/pdfjs/'+folder), { recursive: true });
      }
      mkdirSync(resolve('dist/vendor/ocr/lang'), { recursive: true });
      cpSync(resolve('node_modules/tesseract.js-core'), resolve('dist/vendor/ocr/core'), { recursive: true });
      copyFileSync(resolve('node_modules/tesseract.js/dist/worker.min.js'), resolve('dist/vendor/ocr/worker.min.js'));
      for (const lang of ['eng','ben']) copyFileSync(resolve('node_modules/@tesseract.js-data/'+lang+'/4.0.0/'+lang+'.traineddata.gz'), resolve('dist/vendor/ocr/lang/'+lang+'.traineddata.gz'));
      cpSync(resolve('public/erp'), resolve('dist/erp'), { recursive: true });
    }
  }],
  build: { rollupOptions: { input: { main: resolve('index.html'), admin: resolve('admin.html') } } }
});
