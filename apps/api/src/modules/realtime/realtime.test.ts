import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import http from 'node:http'
import { io as ioClient, type Socket } from 'socket.io-client'
import request from 'supertest'
import type { BookingStatusEvent } from '@car-rental/types'
import { createApp } from '../../app'
import { closeRealtime, initRealtime } from './realtime'

const app = createApp()
let server: http.Server
let url: string

const CUSTOMER = { email: 'customer@demo.test', password: 'Password123!' }
const PROVIDER = { email: 'provider@demo.test', password: 'Password123!' }
const VEHICLE = 'veh-corolla'
const PICKUP = 'branch-downtown'
const DROPOFF = 'branch-airport'

const DAY = 86_400_000
const RUN_BASE = Date.UTC(2032, 0, 1, 10) + Math.floor(Math.random() * 25_000) * 100 * DAY
let windowCursor = 0
function nextDates() {
  const base = RUN_BASE + windowCursor * 4 * DAY
  windowCursor += 1
  return { startAt: new Date(base).toISOString(), endAt: new Date(base + 3 * DAY).toISOString() }
}

let customerToken: string
let providerToken: string

const bearer = (token: string) => ({ Authorization: `Bearer ${token}` })

async function login(creds: { email: string; password: string }): Promise<string> {
  const res = await request(app).post('/auth/login').send(creds)
  expect(res.status).toBe(200)
  return res.body.token
}

function connect(token?: string): Socket {
  return ioClient(url, { auth: token ? { token } : {}, reconnection: false, forceNew: true })
}

function waitConnect(socket: Socket): Promise<void> {
  return new Promise((resolve, reject) => {
    socket.once('connect', () => resolve())
    socket.once('connect_error', (e) => reject(e))
  })
}

/** Resolve with the next booking:status event, or reject after a timeout. */
function nextStatusEvent(socket: Socket): Promise<BookingStatusEvent> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('no event received')), 4000)
    socket.once('booking:status', (e: BookingStatusEvent) => {
      clearTimeout(timer)
      resolve(e)
    })
  })
}

async function reservedBooking(): Promise<string> {
  const created = await request(app)
    .post('/bookings')
    .set(bearer(customerToken))
    .send({ vehicleId: VEHICLE, plan: 'daily', pickupBranchId: PICKUP, dropoffBranchId: DROPOFF, ...nextDates() })
  expect(created.status).toBe(201)
  return created.body.id as string
}

beforeAll(async () => {
  customerToken = await login(CUSTOMER)
  providerToken = await login(PROVIDER)
  server = http.createServer(app)
  initRealtime(server)
  await new Promise<void>((resolve) => server.listen(0, resolve))
  const addr = server.address()
  url = `http://localhost:${typeof addr === 'object' && addr ? addr.port : 0}`
})

afterAll(async () => {
  closeRealtime()
  await new Promise<void>((resolve) => server.close(() => resolve()))
})

describe('realtime', () => {
  it('pushes booking:status to the owning customer on a status change', async () => {
    const socket = connect(customerToken)
    await waitConnect(socket)

    const bookingId = await reservedBooking()
    const event = nextStatusEvent(socket)
    await request(app).post(`/payments/${bookingId}/pay`).set(bearer(customerToken)).send({ method: 'card-mock' })

    const received = await event
    expect(received.bookingId).toBe(bookingId)
    expect(received.status).toBe('confirmed')
    socket.close()
  })

  it('pushes booking:status to the provider room on a provider transition', async () => {
    const bookingId = await reservedBooking()
    await request(app).post(`/payments/${bookingId}/pay`).set(bearer(customerToken)).send({ method: 'card-mock' })

    const socket = connect(providerToken)
    await waitConnect(socket)
    const event = nextStatusEvent(socket)
    await request(app).post(`/bookings/${bookingId}/prepare`).set(bearer(providerToken)).send({})

    const received = await event
    expect(received.bookingId).toBe(bookingId)
    expect(received.status).toBe('vehicle-prepared')
    socket.close()
  })

  it('rejects an unauthenticated connection', async () => {
    const socket = connect()
    const err = await new Promise<Error>((resolve) => socket.once('connect_error', (e) => resolve(e)))
    expect(err.message).toBe('unauthorized')
    socket.close()
  })
})
