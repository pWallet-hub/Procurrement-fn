import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Dev server proxies /api to the backend. Override with VITE_API_PROXY.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': { target: env.VITE_API_PROXY || 'http://localhost:3000', changeOrigin: true },
      },
    },
  };
});
