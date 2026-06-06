import type { NextFunction, Request, Response } from 'express'
import type { UserRole } from '@car-rental/types'
import { verifyToken } from './auth.jwt'
import { getUserById } from './auth.service'
import { toAuthUser } from './auth.mappers'

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'missing bearer token' })
    return
  }
  try {
    const payload = verifyToken(header.slice('Bearer '.length))
    const user = await getUserById(payload.sub)
    if (!user) {
      res.status(401).json({ error: 'user not found' })
      return
    }
    req.user = toAuthUser(user)
    next()
  } catch {
    res.status(401).json({ error: 'invalid or expired token' })
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: 'forbidden' })
      return
    }
    next()
  }
}
