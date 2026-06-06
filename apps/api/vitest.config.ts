import { config } from 'dotenv'
import { defineConfig } from 'vitest/config'

// Point the run at the test DB before any worker imports the Prisma client
// (which reads DATABASE_URL at construction). No override: a DATABASE_URL set in
// the environment (e.g. CI) wins over .env.test.
config({ path: '.env.test' })

export default defineConfig({
  test: {
    globalSetup: ['./vitest.setup.ts'],
  },
})
