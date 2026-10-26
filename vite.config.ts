import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Dev server proxies /api to the production backend by default. Override VITE_API_PROXY for local development.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': { target: env.VITE_API_PROXY || 'https://apipro.afs-rwanda.org', changeOrigin: true },
      },
    },
  };
});
