import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../../app'

const app = createApp()

// Unique emails keep the suite idempotent against the persistent test DB.
const uniqueEmail = (p: string) => `${p}_${Date.now()}_${Math.random().toString(36).slice(2)}@test.com`

describe('auth', () => {
  it('registers a customer and returns a token + user', async () => {
    const email = uniqueEmail('cust')
    const res = await request(app)
      .post('/auth/register')
      .send({ email, password: 'Password123!', name: 'Test Customer', role: 'customer' })

    expect(res.status).toBe(201)
    expect(typeof res.body.token).toBe('string')
    expect(res.body.user.role).toBe('customer')
    expect(res.body.user.providerId).toBeNull()
    expect(res.body.user.email).toBe(email)
  })

  it('registers a provider and creates a tenant (providerId set)', async () => {
    const res = await request(app).post('/auth/register').send({
      email: uniqueEmail('prov'),
      password: 'Password123!',
      name: 'Test Provider',
      role: 'service-provider',
      businessName: 'Acme Rentals',
    })

    expect(res.status).toBe(201)
    expect(res.body.user.role).toBe('service-provider')
    expect(typeof res.body.user.providerId).toBe('string')
  })

  it('rejects a duplicate email with 409', async () => {
    const body = { email: uniqueEmail('dup'), password: 'Password123!', name: 'Dup', role: 'customer' }
    await request(app).post('/auth/register').send(body)
    const res = await request(app).post('/auth/register').send(body)
    expect(res.status).toBe(409)
  })

  it('rejects invalid registration with 400', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'not-an-email', password: 'short', name: '', role: 'customer' })
    expect(res.status).toBe(400)
  })

  it('logs in with correct credentials and rejects a wrong password', async () => {
    const email = uniqueEmail('login')
    await request(app)
      .post('/auth/register')
      .send({ email, password: 'Password123!', name: 'Login User', role: 'customer' })

    const ok = await request(app).post('/auth/login').send({ email, password: 'Password123!' })
    expect(ok.status).toBe(200)
    expect(typeof ok.body.token).toBe('string')

    const bad = await request(app).post('/auth/login').send({ email, password: 'wrong-password' })
    expect(bad.status).toBe(401)
  })

  it('guards /auth/me: 401 without token, 200 with token', async () => {
    const email = uniqueEmail('me')
    const reg = await request(app)
      .post('/auth/register')
      .send({ email, password: 'Password123!', name: 'Me User', role: 'customer' })
    const token: string = reg.body.token

    const noAuth = await request(app).get('/auth/me')
    expect(noAuth.status).toBe(401)

    const withAuth = await request(app).get('/auth/me').set('Authorization', `Bearer ${token}`)
    expect(withAuth.status).toBe(200)
    expect(withAuth.body.user.email).toBe(email)
  })
})
