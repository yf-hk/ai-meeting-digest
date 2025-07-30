import { resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react-oxc'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      semicolons: false,
      quoteStyle: 'single',
      routesDirectory: './src/routes',
      generatedRouteTree: './src/route-tree.gen.ts',
      routeFileIgnorePrefix: '-',
    }),
    react(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/rpc': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
