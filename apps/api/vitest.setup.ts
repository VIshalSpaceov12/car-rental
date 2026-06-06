import { execSync } from 'node:child_process'
import { config } from 'dotenv'

// Prepare the test database once before the suite: apply migrations + seed.
// Local: .env.test supplies DATABASE_URL. CI: the job env supplies it and wins
// (dotenv does not override existing vars).
export default function setup() {
  config({ path: '.env.test' })
  const opts = { stdio: 'inherit' as const, env: process.env }
  execSync('npx prisma migrate deploy', opts)
  execSync('npx prisma db seed', opts)
}
