import type { AuthUser } from '@car-rental/types'

// Attach the authenticated user to the request (set by requireAuth).
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser
    }
  }
}

export {}
