import 'dotenv/config'
import { z } from 'zod'

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(16),
})

/** Validated, typed environment. Fails fast at boot on bad config. */
export const env = schema.parse(process.env)
export type Env = z.infer<typeof schema>
