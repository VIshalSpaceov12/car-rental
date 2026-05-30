import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Workspace packages ship TS source — let Vite transpile them instead of
  // trying to pre-bundle them as external deps.
  optimizeDeps: {
    exclude: ['@car-rental/tokens', '@car-rental/types'],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
