import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vite configuration.
 *
 * The `proxy` entry is the important part. During development the React app is
 * served from port 5173 while the API runs on 5000 — two different origins.
 * Rather than fight CORS in the browser, Vite forwards any request starting
 * with /api to the Express server. From the browser's point of view every
 * request is same-origin, so the frontend code can just call '/api/health'
 * with no base URL and no credentials headaches.
 *
 * In production there is no Vite server, so the frontend uses
 * VITE_API_BASE_URL instead (see src/services/api.ts).
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Fail loudly instead of silently hopping to 5174, which would break the
    // backend's CORS_ORIGIN and this proxy's assumptions.
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
