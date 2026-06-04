import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    host: true,
    allowedHosts: true,
    proxy: {
      '/api': 'http://localhost:3012',
    },
  },

  build: {
    // Separa vendor (React, ReactDOM, React Router) do código da aplicação.
    // O browser re-usa o chunk vendor do cache mesmo quando o app muda.
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
    // Gzip inline hints para assets
    reportCompressedSize: true,
    chunkSizeWarningLimit: 400,
  },
});
