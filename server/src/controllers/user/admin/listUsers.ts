import { type Request, type Response } from 'express'
import { prisma } from '../../../db/db.js'
import { getUserDisplayName } from '../../../utils/userDisplay.js'

const ALLOWED_ROLES = ['ALL', 'DOCTOR', 'PATIENT'] as const
const ALLOWED_SORT_BY = ['NAME', 'CREATED_AT'] as const
const ALLOWED_SORT_ORDER = ['asc', 'desc'] as const
const ALLOWED_VERIFICATION_STATUS = ['NOT_SUBMITTED', 'PENDING', 'VERIFIED', 'REJECTED'] as const

type RoleFilter = (typeof ALLOWED_ROLES)[number]
type SortBy = (typeof ALLOWED_SORT_BY)[number]
type SortOrder = (typeof ALLOWED_SORT_ORDER)[number]
type VerificationStatusFilter = (typeof ALLOWED_VERIFICATION_STATUS)[number]

const parsePagination = (skip: unknown, limit: unknown) => ({
  skipNum: Math.max(0, parseInt(String(skip ?? '0'), 10) || 0),
  limitNum: Math.min(100, Math.max(1, parseInt(String(limit ?? '20'), 10) || 20)),
})

export const listUsers = async (req: Request, res: Response) => {
  try {
    const {
      skip = '0',
      limit = '20',
      role = 'ALL',
      isVerified,
      verificationStatus,
      search,
      sortBy = 'CREATED_AT',
      sortOrder = 'desc',
    } = req.query

    if (!ALLOWED_ROLES.includes(role as RoleFilter)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role filter. Must be one of: ${ALLOWED_ROLES.join(', ')}`,
      })
    }

    if (!ALLOWED_SORT_BY.includes(sortBy as SortBy)) {
      return res.status(400).json({
        success: false,
        message: `Invalid sortBy. Must be one of: ${ALLOWED_SORT_BY.join(', ')}`,
      })
    }

    if (!ALLOWED_SORT_ORDER.includes(sortOrder as SortOrder)) {
      return res.status(400).json({
        success: false,
        message: `Invalid sortOrder. Must be one of: ${ALLOWED_SORT_ORDER.join(', ')}`,
      })
    }

    if (verificationStatus && !ALLOWED_VERIFICATION_STATUS.includes(verificationStatus as VerificationStatusFilter)) {
      return res.status(400).json({
        success: false,
        message: `Invalid verificationStatus. Must be one of: ${ALLOWED_VERIFICATION_STATUS.join(', ')}`,
      })
    }

    const { skipNum, limitNum } = parsePagination(skip, limit)
    const normalizedSearch = typeof search === 'string' ? search.trim() : ''

    const where = {
      role: role === 'ALL' ? { in: ['DOCTOR', 'PATIENT'] } : role,
      ...(isVerified === 'true' ? { emailVerified: true } : {}),
      ...(isVerified === 'false' ? { emailVerified: false } : {}),
      ...(verificationStatus && verificationStatus !== 'NOT_SUBMITTED'
        ? { doctorProfile: { is: { verificationStatus } } }
        : {}),
      ...(verificationStatus === 'NOT_SUBMITTED'
        ? { doctorProfile: null }
        : {}),
      ...(normalizedSearch
        ? {
            OR: [
              { firstName: { contains: normalizedSearch, mode: 'insensitive' } },
              { middleName: { contains: normalizedSearch, mode: 'insensitive' } },
              { lastName: { contains: normalizedSearch, mode: 'insensitive' } },
              { email: { contains: normalizedSearch, mode: 'insensitive' } },
              { phone: { contains: normalizedSearch, mode: 'insensitive' } },
              { doctorProfile: { is: { registrationNumber: { contains: normalizedSearch, mode: 'insensitive' } } } },
            ],
          }
        : {}),
    }

    const orderBy =
      sortBy === 'NAME'
        ? [{ firstName: sortOrder as SortOrder }, { lastName: sortOrder as SortOrder }]
        : { createdAt: sortOrder as SortOrder }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          middleName: true,
          lastName: true,
          email: true,
          phone: true,
          profileImage: true,
          emailVerified: true,
          accountStatus: true,
          createdAt: true,
          role: true,
          doctorProfile: {
            select: {
              id: true,
              verificationStatus: true,
              registrationNumber: true,
              department: true,
              specializations: true,
            },
          },
        },
        orderBy,
        skip: skipNum,
        take: limitNum,
      }),
      prisma.user.count({ where }),
    ])

    const shaped = users.map((user) => ({
      id: user.id,
      fullName: getUserDisplayName(user),
      email: user.email,
      phone: user.phone,
      profileImage: user.profileImage,
      isVerified: user.emailVerified,
      emailVerified: user.emailVerified,
      accountStatus: user.accountStatus,
      createdAt: user.createdAt.toISOString(),
      role: user.role,
      ...(user.role === 'DOCTOR'
        ? {
            verificationStatus: user.doctorProfile?.verificationStatus ?? 'NOT_SUBMITTED',
            doctorProfileId: user.doctorProfile?.id ?? null,
            registrationNumber: user.doctorProfile?.registrationNumber ?? null,
            department: user.doctorProfile?.department ?? null,
            specializations: user.doctorProfile?.specializations ?? [],
          }
        : {}),
    }))

    return res.status(200).json({
      success: true,
      data: shaped,
      pagination: {
        skip: skipNum,
        limit: limitNum,
        total,
        hasMore: skipNum + shaped.length < total,
      },
    })
  } catch (error) {
    console.error('List users error:', error)
    return res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}
