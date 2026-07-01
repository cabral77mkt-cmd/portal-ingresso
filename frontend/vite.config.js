import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Inline o CSS no <head> e remove o <link rel="stylesheet"> (mata o render-blocking).
// O CSS do app é único e pequeno (~6KB gzip) — compensa tirar a requisição extra
// do caminho crítico. Só roda no build; o dev continua com HMR normal.
function inlineCriticalCss() {
  return {
    name: 'inline-critical-css',
    apply: 'build',
    enforce: 'post',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        if (!ctx || !ctx.bundle) return html;
        let css = '';
        const cssFiles = [];
        for (const [file, chunk] of Object.entries(ctx.bundle)) {
          if (file.endsWith('.css') && chunk.type === 'asset') {
            css += chunk.source;
            cssFiles.push(file);
          }
        }
        if (!css) return html;
        // remove os <link rel="stylesheet"> e injeta o CSS inline
        let out = html.replace(/\s*<link[^>]*rel="stylesheet"[^>]*>/g, '');
        out = out.replace('</head>', `<style>${css}</style></head>`);
        // não emite o arquivo .css separado (já está inline)
        for (const f of cssFiles) delete ctx.bundle[f];
        return out;
      },
    },
  };
}

export default defineConfig({
  plugins: [react(), inlineCriticalCss()],

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
          three:  ['three'],
          gsap:   ['gsap'],
        },
      },
    },
    // Gzip inline hints para assets
    reportCompressedSize: true,
    chunkSizeWarningLimit: 400,
  },
});
