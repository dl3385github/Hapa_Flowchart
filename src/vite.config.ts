import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Add Node.js polyfills for crypto and other modules
    nodePolyfills({
      // Whether to polyfill specific globals (default: `{ process: true, Buffer: true }`)
      globals: {
        process: true,
        Buffer: true,
      },
      // Whether to polyfill specific modules (default: `true` for all)
      protocolImports: true,
      // Include specific polyfills for P2P functionality
      include: [
        'crypto',
        'stream',
        'util',
        'buffer',
        'events',
        'net',
        'tls',
        'os',
        'path',
        'fs',
        'assert',
        'constants'
      ]
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Hapa Flowchart',
        short_name: 'HapaFlow',
        description: 'Decentralized flowchart tool with P2P collaboration',
        theme_color: '#0284c7',
        background_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      // Add path aliases here if needed
      // '@': '/src',
      // Enable crypto-browserify polyfill
      crypto: 'crypto-browserify',
      stream: 'stream-browserify',
      assert: 'assert',
      path: 'path-browserify',
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    host: true,
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
    watch: {
      ignored: ['**/node_modules/**']
    }
  },
  build: {
    target: 'esnext',
    sourcemap: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      // Properly handle circular dependencies
      onwarn(warning, warn) {
        if (warning.code === 'CIRCULAR_DEPENDENCY') return;
        warn(warning);
      }
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      // Enable Node.js specific features for browser
      define: {
        global: 'globalThis',
      },
      // Needed for proper Hyperswarm handling in browser
      platform: 'browser',
      target: 'esnext',
      supported: {
        bigint: true
      }
    },
    // Additional dependencies to pre-bundle
    include: [
      'yjs',
      'y-indexeddb'
    ]
  },
}); 