import type { NextFunction, Request, Response } from 'express'
import { addLog } from './log-store'

/**
 * Records every HTTP request/response into the in-memory log store once the
 * response finishes (GACNation's global LoggingInterceptor, as Express middleware).
 * 5xx → error, 4xx → warn, else info. Bodies are deliberately not captured.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now()
  res.on('finish', () => {
    const responseTime = Date.now() - start
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info'
    addLog(level, `${req.method} ${req.originalUrl} - ${res.statusCode} - ${responseTime}ms`, 'HTTP', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime,
      userAgent: req.headers['user-agent'] ?? null,
    })
  })
  next()
}
