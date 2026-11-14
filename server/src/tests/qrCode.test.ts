import { describe, it, expect } from 'vitest'
import { resolveClientBaseUrl, isOriginAllowed } from '../config/env.js'

describe('Doctor QR Code & URL Resolution', () => {
  it('correctly validates allowed origins and Vercel domains', () => {
    expect(isOriginAllowed('http://localhost:5173')).toBe(true)
    expect(isOriginAllowed('http://localhost:3000')).toBe(true)
    expect(isOriginAllowed('https://clinicflow2-0.vercel.app')).toBe(true)
    expect(isOriginAllowed('https://clinicflow2-0-git-preview.vercel.app')).toBe(true)
    expect(isOriginAllowed('https://malicious-site.com')).toBe(false)
  })

  it('resolves client base URL from request Origin header', () => {
    const reqWithVercel = {
      get: (header: string) => (header.toLowerCase() === 'origin' ? 'https://clinicflow2-0.vercel.app' : undefined),
    }
    expect(resolveClientBaseUrl(reqWithVercel)).toBe('https://clinicflow2-0.vercel.app')

    const reqWithLocal = {
      get: (header: string) => (header.toLowerCase() === 'origin' ? 'http://localhost:5173' : undefined),
    }
    expect(resolveClientBaseUrl(reqWithLocal)).toBe('http://localhost:5173')
  })

  it('resolves client base URL from request Referer header if Origin is absent', () => {
    const reqWithReferer = {
      get: (header: string) =>
        header.toLowerCase() === 'referer' ? 'https://clinicflow2-0.vercel.app/doctor/dashboard' : undefined,
    }
    expect(resolveClientBaseUrl(reqWithReferer)).toBe('https://clinicflow2-0.vercel.app')
  })

  it('never falls back to localhost in production when resolving without request headers', () => {
    // If environment was production
    const originalEnv = process.env.NODE_ENV
    try {
      process.env.NODE_ENV = 'production'
      const url = resolveClientBaseUrl()
      expect(url).not.toContain('localhost')
      expect(url).toBe('https://clinicflow2-0.vercel.app')
    } finally {
      process.env.NODE_ENV = originalEnv
    }
  })
})
