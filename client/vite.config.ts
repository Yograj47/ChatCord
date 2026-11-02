import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

// https://vite.dev/config/
export default defineConfig({
  build: { manifest: true },
  server: process.env.VITE_PROXY_TARGET
    ? {
        proxy: {
          '/api': { target: process.env.VITE_PROXY_TARGET, changeOrigin: true },
          '/socket.io': { target: process.env.VITE_PROXY_TARGET, ws: true, changeOrigin: true },
        },
      }
    : undefined,
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
});
