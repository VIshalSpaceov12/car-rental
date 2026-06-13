import jwt from 'jsonwebtoken'
import type { UserRole } from '@car-rental/types'
import { env } from '../../config/env'

export interface JwtPayload {
  sub: string
  role: UserRole
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): JwtPayload {
  // Pin the algorithm: reject tokens signed with anything but HS256 (defends
  // against alg-confusion attacks, e.g. a forged `alg: none` or RS/HS swap).
  const decoded = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] })
  if (typeof decoded === 'string' || !decoded.sub) {
    throw new Error('invalid token payload')
  }
  return { sub: String(decoded.sub), role: decoded.role as UserRole }
}
