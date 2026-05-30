import { createApp } from './app'
import { env } from './config/env'

const app = createApp()

app.listen(env.PORT, () => {
  console.log(`car-rental-api listening on http://localhost:${env.PORT}`)
})
