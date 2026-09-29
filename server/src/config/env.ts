import dotenv from 'dotenv';

// Load environment variables immediately
dotenv.config();

export const parseAllowedOrigins = (clientUrlEnv?: string): string[] => {
  const defaults = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    'https://clinicflow2-0.vercel.app',
  ];

  if (!clientUrlEnv) {
    return defaults;
  }

  const userOrigins = clientUrlEnv
    .split(',')
    .map((url) => url.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  return Array.from(new Set([...userOrigins, ...defaults]));
};

export const env = {
  NODE_ENV: (process.env.NODE_ENV ?? 'development') as 'development' | 'production' | 'test',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  PORT: Number(process.env.PORT) || 3000,

  DATABASE_URL: process.env.DATABASE_URL || '',
  DIRECT_URL: process.env.DIRECT_URL || process.env.DATABASE_URL || '',

  CLIENT_URL: (process.env.CLIENT_URL || 'http://localhost:5173').trim().replace(/\/+$/, ''),
  ALLOWED_ORIGINS: parseAllowedOrigins(process.env.CLIENT_URL),

  EMAIL: {
    SERVICE: process.env.EMAIL_SERVICE,
    HOST: process.env.EMAIL_HOST || 'smtp.gmail.com',
    PORT: Number(process.env.EMAIL_PORT) || 587,
    SECURE: process.env.EMAIL_SECURE === 'true',
    USER: process.env.EMAIL_USER || '',
    PASS: process.env.EMAIL_APP_PASSWORD || process.env.EMAIL_PASS || '',
    FROM:
      process.env.EMAIL_FROM ||
      (process.env.EMAIL_USER
        ? `"ClinicFlow" <${process.env.EMAIL_USER}>`
        : '"ClinicFlow" <no-reply@clinicflow.com>'),
  },

  BREVO: {
    API_KEY: process.env.BREVO_API_KEY || '',
  },

  // Explicit provider override: 'gmail' | 'brevo'
  // Falls back to auto-detection: production → brevo, otherwise → gmail
  EMAIL_PROVIDER: (process.env.EMAIL_PROVIDER || (process.env.NODE_ENV === 'production' ? 'brevo' : 'gmail')) as
    | 'gmail'
    | 'brevo',

  CLOUDINARY: {
    CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
    API_KEY: process.env.CLOUDINARY_API_KEY || '',
    API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  },

  ADMIN_SEED: {
    EMAIL: process.env.ADMIN_SEED_EMAIL || 'admin@clinicflow.com',
    PASSWORD: process.env.ADMIN_SEED_PASSWORD || 'admin@123',
    NAME: process.env.ADMIN_SEED_NAME || 'Super Admin',
    PHONE: process.env.ADMIN_SEED_PHONE || '+910000000000',
  },
} as const;

export const isOriginAllowed = (origin: string): boolean => {
  const normalized = origin.trim().replace(/\/+$/, '');

  // Exact match against allowed origins (including CLIENT_URL and defaults)
  if (env.ALLOWED_ORIGINS.some((allowed) => allowed === normalized)) {
    return true;
  }

  // In non-production, permit any localhost or loopback port
  if (!env.IS_PRODUCTION) {
    if (
      /^https?:\/\/localhost(:\d+)?$/.test(normalized) ||
      /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(normalized)
    ) {
      return true;
    }
  }

  if (normalized === env.CLIENT_URL) {
    return true;
  }

  return false;
};
