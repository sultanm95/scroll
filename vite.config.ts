import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/anilist': {
        target: 'https://graphql.anilist.co',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/anilist/, ''),
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})