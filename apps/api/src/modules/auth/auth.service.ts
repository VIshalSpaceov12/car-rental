import bcrypt from 'bcrypt'
import type { AuthResponse, LoginRequest, RegisterRequest } from '@car-rental/types'
import { prisma } from '../../db/prisma'
import { signToken } from './auth.jwt'
import { LOCALE_TO_DB, ROLE_TO_DB, toAuthUser } from './auth.mappers'

export class AuthError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

export async function register(input: RegisterRequest): Promise<AuthResponse> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } })
  if (existing) throw new AuthError(409, 'email already registered')

  const passwordHash = await bcrypt.hash(input.password, 10)
  const locale = LOCALE_TO_DB[input.locale ?? 'en']

  // A self-registering provider creates its own tenant (Provider + default settings).
  let providerId: string | null = null
  if (input.role === 'service-provider') {
    const businessName = input.businessName?.trim() || `${input.name}'s Rentals`
    const provider = await prisma.provider.create({
      data: {
        name: businessName,
        colors: { primary: '#2563eb', secondary: '#1d4ed8', background: '#ffffff' },
        defaultLocale: locale,
        businessSettings: {
          create: {
            taxRatePct: '5.00',
            currency: 'AED',
            minRentalDays: 1,
            cancellationPolicy: 'Free cancellation up to 24h before pickup.',
            planMultipliers: { daily: 1, weekly: 0.9, monthly: 0.8, 'long-term': 0.7 },
          },
        },
      },
    })
    providerId = provider.id
  }

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      name: input.name,
      role: ROLE_TO_DB[input.role],
      locale,
      phone: input.phone ?? null,
      providerId,
    },
  })

  return { token: signToken({ sub: user.id, role: input.role }), user: toAuthUser(user) }
}

export async function login(input: LoginRequest): Promise<AuthResponse> {
  const user = await prisma.user.findUnique({ where: { email: input.email } })
  if (!user) throw new AuthError(401, 'invalid credentials')

  const ok = await bcrypt.compare(input.password, user.passwordHash)
  if (!ok) throw new AuthError(401, 'invalid credentials')

  const authUser = toAuthUser(user)
  return { token: signToken({ sub: user.id, role: authUser.role }), user: authUser }
}

export function getUserById(id: string) {
  return prisma.user.findUnique({ where: { id } })
}
