import { defineConfig, loadEnv } from 'vite';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxyTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:8080';

  return {
    plugins: [react(), tailwindcss()],
    resolve: { alias: { '@': path.resolve(__dirname, './src') } },
    server: {
      // SuperTokens tiene websiteDomain = http://localhost:5173 por defecto:
      // el callback de Google vuelve a este puerto.
      port: 5173,
      strictPort: true,
      // En desarrollo /api/* se redirige al backend (evita CORS).
      proxy: { '/api': { target: proxyTarget, changeOrigin: true } },
    },
  };
});
