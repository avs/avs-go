import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';

export default defineConfig({
  resolve: {
    alias: {
      '@avs/go': fileURLToPath(new URL('../../packages/core', import.meta.url))
    }
  }
});