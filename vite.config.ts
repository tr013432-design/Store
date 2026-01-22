import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // CORREÇÃO 1: Removi arquivos inexistentes para evitar erro 404 no cache.
      // Adicionei apenas o 'logo.png' que vi que existe na sua pasta public.
      includeAssets: ['logo.png'], 
      
      manifest: {
        name: 'Sara Store Gestão',
        short_name: 'Sara Store',
        description: 'Sistema de Gestão Financeira e Estoque - Sara Store',
        theme_color: '#09090b',
        background_color: '#09090b',
        display: 'standalone',
        orientation: 'portrait',
        
        // CORREÇÃO 2: Adicionado start_url e scope (Essencial para corrigir a Tela Preta)
        start_url: '/',
        scope: '/',

        icons: [
          {
            src: 'pwa-64x64.png',
            sizes: '64x64',
            type: 'image/png'
          },
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'  
          },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      }
    })
  ],
});
