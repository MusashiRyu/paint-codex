import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    /**
     * The bundle is ~1.4 MB because 1.1 MB of it is `paints.snapshot.json`,
     * and that is deliberate. Vite's default 500 kB warning asks for a dynamic
     * import to split it out — which is exactly what this app must not do:
     * `paintRepository` resolves cache-then-bundled *at import*, so reads stay
     * synchronous and there is never a paintless first render. Splitting the
     * catalog would make the one thing the app is for arrive asynchronously,
     * in a packaged app where the payload is on local disk and costs no round
     * trip anyway.
     *
     * The limit is raised rather than switched off, and sits just above the
     * current size, so accidental bloat still trips it. Adding a fourth brand
     * should trip it — that is a size change worth looking at.
     */
    chunkSizeWarningLimit: 1600,
  },
})
