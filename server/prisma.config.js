import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'src/prisma/schema.prisma',
  datasource: {
    // Used by PrismaClient at runtime (can be pooled connection for Neon)
    url: env('DATABASE_URL'),
  },
  migrate: {
    // Used by prisma migrate deploy/dev — must be a direct (non-pooled) connection
    url: env('DIRECT_URL'),
  },
})
