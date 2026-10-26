/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // Atualiza sozinho: cardápio de mesa não pode ficar preso numa versão antiga esperando um toque.
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['icons/favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'ONE AR Menu',
        short_name: 'Cardápio',
        description: 'Cardápio gastronômico com visualização 3D e realidade aumentada.',
        lang: 'pt-BR',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#111514',
        theme_color: '#111514',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Pré-cache só do app (JS/CSS/HTML/ícones). Modelos 3D e imagens de produto ficam fora.
        globPatterns: ['**/*.{js,css,html,svg,woff2}', 'icons/*.png'],
        // model-viewer (~1 MB) fica fora do pré-cache: só é baixado quando alguém abre o 3D.
        globIgnores: ['**/demo/**', '**/*.glb', '**/*.usdz', '**/model-viewer-*.js', '**/*latin-ext*'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/functions/],
        runtimeCaching: [
          {
            // Dados do cardápio (Supabase REST): sempre rede primeiro; cache curto só para leitura offline.
            urlPattern: ({ url }) => url.pathname.startsWith('/rest/v1/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'menu-data',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 },
            },
          },
          {
            // Modelos 3D: só entram no cache depois de abertos pelo cliente, com limite baixo.
            urlPattern: ({ url }) => /\.(glb|usdz)$/i.test(url.pathname),
            handler: 'CacheFirst',
            options: {
              cacheName: 'models-3d',
              expiration: { maxEntries: 8, maxAgeSeconds: 7 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
              rangeRequests: true,
            },
          },
          {
            // Chunks com hash (inclui o model-viewer): imutáveis, cache após o primeiro uso.
            urlPattern: ({ url }) => url.pathname.startsWith('/assets/') && url.pathname.endsWith('.js'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'app-chunks',
              expiration: { maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
          },
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'images',
              expiration: { maxEntries: 80, maxAgeSeconds: 14 * 24 * 60 * 60 },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    target: 'es2022',
    sourcemap: false,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router'],
          query: ['@tanstack/react-query'],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
    coverage: { reporter: ['text', 'html'], include: ['src/**/*.{ts,tsx}'] },
  },
});
