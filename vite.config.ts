import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Slow Spider - Project Management & Milestones',
        short_name: 'Slow Spider',
        description: 'Combine project management, milestone tracking, cold store archival, and quick capture.',
        theme_color: '#090A0C',
        background_color: '#090A0C',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  esbuild: {
    drop: ['debugger'],
  },
  server: {
    port: 5173,
    host: true
  }
});
