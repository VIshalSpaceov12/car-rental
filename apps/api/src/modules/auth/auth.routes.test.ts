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

  it('registers a provider and creates a tenant (providerId + branding set)', async () => {
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
    // AuthResponse.branding is required and populated for providers.
    expect(res.body.branding.name).toBe('Acme Rentals')
    expect(typeof res.body.branding.colors.primary).toBe('string')
  })

  it('uses provider-supplied brand colors when given, else the platform default', async () => {
    const custom = await request(app).post('/auth/register').send({
      email: uniqueEmail('brandprov'),
      password: 'Password123!',
      name: 'Brand Provider',
      role: 'service-provider',
      businessName: 'Brand Co',
      colors: { primary: '#123456', primaryDark: '#0a0a0a' },
    })
    expect(custom.body.branding.colors.primary).toBe('#123456')

    const def = await request(app).post('/auth/register').send({
      email: uniqueEmail('defprov'),
      password: 'Password123!',
      name: 'Default Provider',
      role: 'service-provider',
      businessName: 'Default Co',
    })
    expect(def.body.branding.colors.primary).toBe('#E5322B')
  })

  it('requires businessName for service-provider registration (400)', async () => {
    const res = await request(app).post('/auth/register').send({
      email: uniqueEmail('nobiz'),
      password: 'Password123!',
      name: 'No Biz',
      role: 'service-provider',
    })
    expect(res.status).toBe(400)
  })

  it('returns null branding for a customer', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: uniqueEmail('custbrand'), password: 'Password123!', name: 'Cust Brand', role: 'customer' })
    expect(res.status).toBe(201)
    expect(res.body.branding).toBeNull()
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

  it('normalizes email case: registers lower, logs in with mixed case', async () => {
    const lower = uniqueEmail('case')
    await request(app)
      .post('/auth/register')
      .send({ email: lower, password: 'Password123!', name: 'Case User', role: 'customer' })

    const mixed = lower.toUpperCase()
    const res = await request(app).post('/auth/login').send({ email: mixed, password: 'Password123!' })
    expect(res.status).toBe(200)
    expect(res.body.user.email).toBe(lower)
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
    expect(withAuth.body.branding).toBeNull() // customer has no tenant
  })

  it('serves the public single-brand /branding (seeded racing-red provider)', async () => {
    const res = await request(app).get('/branding')
    expect(res.status).toBe(200)
    expect(typeof res.body.name).toBe('string')
    expect(typeof res.body.colors.primary).toBe('string')
  })
})
