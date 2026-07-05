import { type Request, type Response } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../../db/db.js'
import { sendOtpEmail } from '../../services/email.service.js'
import { createOtpForUser } from '../../services/otp.service.js'
import { getUserDisplayName } from '../../utils/userDisplay.js'

const ALLOWED_ROLES = ['DOCTOR', 'PATIENT'] as const
const ALLOWED_GENDERS = ['MALE', 'FEMALE', 'OTHER'] as const

type SignupRole = (typeof ALLOWED_ROLES)[number]
type SignupGender = (typeof ALLOWED_GENDERS)[number]

const splitFullName = (fullName: string) => {
  const parts = fullName.trim().split(/\s+/)
  return {
    firstName: parts[0] ?? '',
    middleName: parts.length > 2 ? parts.slice(1, -1).join(' ') : null,
    lastName: parts.length > 1 ? parts[parts.length - 1] : null,
  }
}

export const signup = async (req: Request, res: Response) => {
  try {
    const { fullName, firstName, middleName, lastName, email, phone, password, role, gender } = req.body
    const normalizedRole = typeof role === 'string' ? role.toUpperCase() : role
    const normalizedGender = typeof gender === 'string' ? gender.toUpperCase() : gender

    const resolvedName = fullName ? splitFullName(fullName) : { firstName, middleName: middleName ?? null, lastName: lastName ?? null }

    if (!resolvedName.firstName) {
      return res.status(400).json({ success: false, field: 'firstName', message: 'First name is required' })
    }
    if (!email) {
      return res.status(400).json({ success: false, field: 'email', message: 'Email is required' })
    }
    if (!phone) {
      return res.status(400).json({ success: false, field: 'phone', message: 'Phone number is required' })
    }
    if (!password) {
      return res.status(400).json({ success: false, field: 'password', message: 'Password is required' })
    }
    if (!role) {
      return res.status(400).json({ success: false, field: 'role', message: 'Role is required' })
    }
    if (!ALLOWED_ROLES.includes(normalizedRole as SignupRole)) {
      return res.status(400).json({ success: false, message: `role must be one of: ${ALLOWED_ROLES.join(', ')}` })
    }
    if (!ALLOWED_GENDERS.includes(normalizedGender as SignupGender)) {
      return res.status(400).json({ success: false, field: 'gender', message: `gender must be one of: ${ALLOWED_GENDERS.join(', ')}` })
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone }],
      },
    })

    if (existingUser) {
      return res.status(409).json({
        success: false,
        field: existingUser.email === email ? 'email' : 'phone',
        message: existingUser.email === email ? 'Email already exists' : 'Phone already exists',
      })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        firstName: resolvedName.firstName,
        middleName: resolvedName.middleName,
        lastName: resolvedName.lastName,
        email,
        phone,
        password: hashedPassword,
        gender: normalizedGender,
        role: normalizedRole,
        accountStatus: 'ACTIVE',
      },
    })

    const otp = await createOtpForUser(user.id)
    await sendOtpEmail(user.email, otp)

    return res.status(201).json({
      success: true,
      message: 'Account created. A verification code has been sent to your email.',
      data: { id: user.id, fullName: getUserDisplayName(user), email: user.email, role: user.role },
    })
  } catch (error) {
    console.error('Signup error:', error)
    return res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}
