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
    middlewares: [
      (req, res, next) => {
        // Set CSP header for development
        res.setHeader('Content-Security-Policy', [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://graphql.anilist.co",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: https: http:",
          "font-src 'self' data: https:",
          "connect-src 'self' http://localhost:3001 http://127.0.0.1:3001 https://graphql.anilist.co https://api.mangadex.org http://localhost:8080 ws://localhost:5173 ws://localhost:*",
          "frame-src 'self'",
          "object-src 'none'",
          "media-src 'self' http: https:",
          "child-src 'self'",
          "form-action 'self'"
        ].join('; '));
        next();
      }
    ],
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