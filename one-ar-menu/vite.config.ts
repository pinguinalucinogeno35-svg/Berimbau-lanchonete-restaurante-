/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// Distância inicial do prato na AR (WebXR do <model-viewer>). O original coloca o objeto a no mínimo 1 m da câmera,
// o que deixa um prato de mesa longe e aparentemente pequeno. Aqui o prato nasce a 35 cm (pedido do cliente), ou um
// pouco além do raio do objeto se ele for maior, para a câmera nunca ficar dentro dele; depois a altura é
// ajustada à superfície da mesa e o cliente ainda pode arrastar. Não afeta Scene Viewer nem Quick Look.
export const AR_DISTANCIA_INICIAL_M = 0.35;
const AR_FOLGA_RAIO = 1.2;
const ORIGINAL_DISTANCIA = 'Math.max(1, 2 * scene.boundingSphere.radius)';

export function arPlacementDistance(): Plugin {
  return {
    name: 'one-ar-distancia-inicial',
    enforce: 'pre',
    transform(code, id) {
      if (!/@google[\\/]model-viewer[\\/]lib[\\/]three-components[\\/]ARRenderer\.js$/.test(id)) return;
      // Se uma atualização do model-viewer mudar esse trecho, o build falha em vez de perder o ajuste em silêncio.
      if (!code.includes(ORIGINAL_DISTANCIA))
        this.error('model-viewer: trecho da distância inicial da AR não encontrado; revise o ajuste.');
      return code.replace(
        ORIGINAL_DISTANCIA,
        `Math.max(${AR_DISTANCIA_INICIAL_M}, ${AR_FOLGA_RAIO} * scene.boundingSphere.radius)`,
      );
    },
  };
}

// Manifesto do app instalado conforme a marca do build (VITE_BRAND). O tema visual em si pode ser trocado
// em tempo de execução com ?tema=; nome e ícone do app instalado seguem o build.
const MANIFESTOS = {
  one: { name: 'ONE AR Menu', short: 'Cardápio', cor: '#111514', fundo: '#111514', icones: '/icons' },
  berimbau: {
    name: 'Berimbau Gourmet · Cardápio',
    short: 'Berimbau',
    cor: '#FCF6EF',
    fundo: '#FCF6EF',
    icones: '/brand/berimbau',
  },
} as const;

export default defineConfig(({ mode }) => {
  const marca = loadEnv(mode, process.cwd(), 'VITE_').VITE_BRAND === 'berimbau' ? 'berimbau' : 'one';
  const m = MANIFESTOS[marca];
  return {
    plugins: [
      arPlacementDistance(),
      react(),
      tailwindcss(),
      VitePWA({
        // Atualiza sozinho: cardápio de mesa não pode ficar preso numa versão antiga esperando um toque.
        registerType: 'autoUpdate',
        injectRegister: false,
        includeAssets: ['icons/favicon.svg', 'icons/apple-touch-icon.png'],
        manifest: {
          name: m.name,
          short_name: m.short,
          description: 'Cardápio gastronômico com visualização 3D e realidade aumentada.',
          lang: 'pt-BR',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          orientation: 'portrait',
          background_color: m.fundo,
          theme_color: m.cor,
          icons: [
            { src: `${m.icones}/icon-192.png`, sizes: '192x192', type: 'image/png' },
            { src: `${m.icones}/icon-512.png`, sizes: '512x512', type: 'image/png' },
            {
              src: `${m.icones}/icon-maskable-512.png`,
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          // Pré-cache só do app (JS/CSS/HTML/ícones). Modelos 3D e imagens de produto ficam fora.
          globPatterns: ['**/*.{js,css,html,svg,woff2}', 'icons/*.png', 'brand/**/*.webp'],
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
  };
});
