import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: 'src/App/main.jsx'
    }
  },
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
})