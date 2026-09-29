import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL || env('DATABASE_URL')

export default defineConfig({
  schema: 'src/prisma/schema.prisma',
  datasource: {
    url: dbUrl,
  },
})
