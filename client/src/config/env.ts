/**
 * Centralized Frontend Environment Configuration
 *
 * Supports:
 * - Local development (.env / .env.local -> http://localhost:3000)
 * - Production (Vercel environment variables -> https://clinicflow2-0-1.onrender.com)
 */

const rawApiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
const rawSocketUrl = (import.meta.env.VITE_SOCKET_URL as string | undefined)?.trim();

const stripTrailingSlash = (url: string) => url.replace(/\/+$/, '');

/**
 * Returns the base origin of the backend server (without trailing slash or /api path).
 * Example: "http://localhost:3000" or "https://clinicflow2-0-1.onrender.com"
 */
export const getApiOrigin = (): string => {
  if (rawApiUrl) {
    const cleaned = stripTrailingSlash(rawApiUrl);
    // If the provided VITE_API_URL accidentally ends with /api, remove it so we get the root origin
    return cleaned.endsWith('/api') ? cleaned.slice(0, -4) : cleaned;
  }

  if (import.meta.env.DEV) {
    return 'http://localhost:3000';
  }

  // Fallback production backend URL
  return 'https://clinicflow2-0-1.onrender.com';
};

/**
 * Base URL for all API requests, always formatted with /api (e.g. "http://localhost:3000/api")
 */
export const API_BASE_URL = `${getApiOrigin()}/api`;

/**
 * URL for Socket.IO realtime connection.
 * Defaults to VITE_SOCKET_URL if provided; otherwise derives from the backend origin.
 */
export const getSocketUrl = (): string => {
  if (rawSocketUrl) {
    return stripTrailingSlash(rawSocketUrl);
  }
  return getApiOrigin();
};
