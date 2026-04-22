import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5850,
    strictPort: true,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3050',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3050',
        changeOrigin: true,
      },
    },
  },
});
