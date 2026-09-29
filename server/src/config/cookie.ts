import type { CookieOptions } from 'express';
import { env } from './env.js';

/**
 * Returns environment-aware cookie options for session cookies.
 *
 * In Production:
 * - Frontend and backend are hosted on separate origins (Vercel & Render).
 * - Cross-site cookie transmission requires sameSite: 'none' and secure: true.
 *
 * In Local Development:
 * - Running over standard HTTP on localhost.
 * - Browsers reject sameSite: 'none' without secure: true, and reject secure: true over plain HTTP.
 * - Uses sameSite: 'lax' and secure: false.
 */
export const getSessionCookieOptions = (expiresAt?: Date): CookieOptions => {
  const isProd = env.IS_PRODUCTION;
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
    ...(expiresAt ? { expires: expiresAt } : {}),
  };
};

/**
 * Returns cookie options matching getSessionCookieOptions to ensure
 * the browser deletes the session cookie cleanly across environments.
 */
export const getClearCookieOptions = (): CookieOptions => {
  const isProd = env.IS_PRODUCTION;
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
  };
};
