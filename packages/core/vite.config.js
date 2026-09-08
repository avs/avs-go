import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      entry: resolve(import.meta.dirname, 'dist/index.js'),
      name: 'AvsGo',
      fileName: () => 'avs-go.min.js',
      formats: ['umd']
    }
  }
});