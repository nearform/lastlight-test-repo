import { defineConfig, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import { getRequestListener } from '@hono/node-server'

// Run the Hono app as middleware inside Vite's dev server so the React
// client and the /api/* routes are served from a single origin (no proxy,
// no second process). The module is loaded through Vite so server edits
// hot-reload like the rest of the app.
function honoDevServer(): PluginOption {
  return {
    name: 'hono-dev-server',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/api')) return next()
        server
          .ssrLoadModule('/src/server/index.ts')
          .then(({ default: app }) => getRequestListener(app.fetch)(req, res))
          .catch(next)
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), honoDevServer()],
})
