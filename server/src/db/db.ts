import 'dotenv/config'
import { PrismaClient } from '../generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})

export const prisma = new PrismaClient({ adapter })

export const connectDB = async () => {
  try {
    await prisma.$connect()
    console.log('Database connected!')
  } catch (error) {
    console.error('Database connection failed:', error)
    process.exit(1)
  }
}