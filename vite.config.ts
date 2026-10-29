import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { handleRatesRequest } from './server/rates-handler.mjs'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const appId = env.OPEN_EXCHANGE_RATES_APP_ID?.trim()

  return {
  plugins: [
    ...react(),
    {
      name: 'shishutsu-note-rates-proxy',
      configureServer(server) {
        server.middlewares.use((request, response, next) => {
          if (new URL(request.url ?? '/', 'http://localhost').pathname !== '/api/rates') return next()
          void handleRatesRequest(request, response, appId)
        })
      },
    },
  ],
  }
})
