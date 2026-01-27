import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Sara Regional',
        short_name: 'SaraStore',
        description: 'Sistema de Gestão Sara Regional',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        icons: [
          {
            src: 'logo.png', // Usando sua logo atual
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'logo.png', // O ideal é ter uma imagem 512x512, mas a logo serve por enquanto
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})
