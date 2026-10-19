import { type NextFunction, type Request, type Response } from 'express'

interface RateLimitRecord {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitRecord>()

// Clean up expired records every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of rateLimitStore.entries()) {
    if (record.resetTime <= now) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000).unref?.()

export const createRateLimiter = (options: { windowMs: number; max: number; message?: string }) => {
  const { windowMs, max, message = 'Too many requests, please try again later.' } = options

  return (req: Request, res: Response, next: NextFunction) => {
    // Determine client identifier (IP or X-Forwarded-For)
    const forwarded = req.headers['x-forwarded-for']
    const ip = (typeof forwarded === 'string' ? forwarded.split(',')[0]?.trim() : null) || req.ip || req.socket.remoteAddress || 'unknown'
    const key = `${req.baseUrl || ''}${req.path}:${ip}`

    const now = Date.now()
    const record = rateLimitStore.get(key)

    if (!record || record.resetTime <= now) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
      return next()
    }

    if (record.count >= max) {
      const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000)
      res.setHeader('Retry-After', retryAfterSeconds)
      return res.status(429).json({
        success: false,
        message,
        retryAfter: retryAfterSeconds,
      })
    }

    record.count += 1
    return next()
  }
}

// Pre-configured rate limiters
export const publicBookingLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // max 20 booking requests per minute per IP
  message: 'Booking request limit reached. Please wait a moment before trying again.',
})

export const publicManagementLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30, // max 30 management requests per minute per IP
  message: 'Management request limit reached. Please wait a moment before trying again.',
})
