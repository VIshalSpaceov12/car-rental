import { createServer } from 'node:http'
import { createApp } from './app'
import { env } from './config/env'
import { initRealtime } from './modules/realtime/realtime'

const server = createServer(createApp())
initRealtime(server)

server.listen(env.PORT, () => {
  console.log(`car-rental-api listening on http://localhost:${env.PORT}`)
})
