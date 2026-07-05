import bcrypt from 'bcryptjs'
import { prisma } from '../db/db.js'

const SALT_ROUNDS = 10

const splitName = (fullName: string) => {
  const parts = fullName.trim().split(/\s+/)
  return {
    firstName: parts[0] ?? 'Super',
    middleName: parts.length > 2 ? parts.slice(1, -1).join(' ') : null,
    lastName: parts.length > 1 ? parts[parts.length - 1] : 'Admin',
  }
}

const seedAdmin = async () => {
  const email = process.env.ADMIN_SEED_EMAIL
  const password = process.env.ADMIN_SEED_PASSWORD
  const fullName = process.env.ADMIN_SEED_NAME ?? 'Super Admin'
  const phone = process.env.ADMIN_SEED_PHONE ?? '+910000000000'

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
