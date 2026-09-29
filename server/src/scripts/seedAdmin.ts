import bcrypt from 'bcryptjs'
import { prisma } from '../db/db.js'

import { env } from '../config/env.js'

const SALT_ROUNDS = 10

const splitName = (fullName: string) => {
  const parts = fullName.trim().split(/\s+/)
  return {
    firstName: parts[0] ?? 'Super',
    middleName: parts.length > 2 ? parts.slice(1, -1).join(' ') : null,
    lastName: (parts.length > 1 ? parts[parts.length - 1] : 'Admin') ?? 'Admin',
  }
}

const seedAdmin = async () => {
  const email = env.ADMIN_SEED.EMAIL
  const password = env.ADMIN_SEED.PASSWORD
  const fullName = env.ADMIN_SEED.NAME
  const phone = env.ADMIN_SEED.PHONE

  if (!email || !password) {
    console.error('Missing ADMIN_SEED_EMAIL or ADMIN_SEED_PASSWORD in your environment. Add both to .env and try again.')
    process.exit(1)
  }

  const existing = await prisma.user.findUnique({ where: { email } })

  if (existing) {
    console.log(`A user with email "${email}" already exists (role: ${existing.role}). Nothing to do.`)
    await prisma.$disconnect()
    return
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)
  const name = splitName(fullName)

  const admin = await prisma.user.create({
    data: {
      ...name,
      email,
      phone,
      password: hashedPassword,
      gender: 'OTHER',
      role: 'ADMIN',
      accountStatus: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
    },
  })

  console.log(`Admin created: ${admin.email} (id: ${admin.id})`)
  await prisma.$disconnect()
}

seedAdmin().catch(async (error) => {
  console.error('Failed to seed admin:', error)
  await prisma.$disconnect()
  process.exit(1)
})
