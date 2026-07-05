import { type Request, type Response } from 'express'
import { prisma } from '../../../../db/db.js'
import { getUserDisplayName } from '../../../../utils/userDisplay.js'

const ALLOWED_STATUSES = ['ALL', 'PENDING', 'VERIFIED', 'REJECTED'] as const
const ALLOWED_SORT_BY = ['NAME', 'CREATED_AT', 'STATUS'] as const
const ALLOWED_SORT_ORDER = ['asc', 'desc'] as const

type DoctorStatusFilter = (typeof ALLOWED_STATUSES)[number]
type SortBy = (typeof ALLOWED_SORT_BY)[number]
type SortOrder = (typeof ALLOWED_SORT_ORDER)[number]

const parsePagination = (skip: unknown, limit: unknown) => ({
  skipNum: Math.max(0, parseInt(String(skip ?? '0'), 10) || 0),
  limitNum: Math.min(100, Math.max(1, parseInt(String(limit ?? '20'), 10) || 20)),
})

export const listDoctors = async (req: Request, res: Response) => {
  try {
    const {
      skip = '0',
      limit = '20',
      status = 'ALL',
      search,
      department,
      specialization,
      sortBy = 'CREATED_AT',
      sortOrder = 'desc',
    } = req.query

    if (!ALLOWED_STATUSES.includes(status as DoctorStatusFilter)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${ALLOWED_STATUSES.join(', ')}` })
    }
    if (!ALLOWED_SORT_BY.includes(sortBy as SortBy)) {
      return res.status(400).json({ success: false, message: `Invalid sortBy. Must be one of: ${ALLOWED_SORT_BY.join(', ')}` })
    }
    if (!ALLOWED_SORT_ORDER.includes(sortOrder as SortOrder)) {
      return res.status(400).json({ success: false, message: `Invalid sortOrder. Must be one of: ${ALLOWED_SORT_ORDER.join(', ')}` })
    }

    const { skipNum, limitNum } = parsePagination(skip, limit)
    const normalizedSearch = typeof search === 'string' ? search.trim() : ''
    const normalizedDepartment = typeof department === 'string' ? department.trim() : ''
    const normalizedSpecialization = typeof specialization === 'string' ? specialization.trim() : ''

    const where = {
      role: 'DOCTOR' as const,
      doctorProfile: {
        is: {
          ...(status !== 'ALL' ? { verificationStatus: status as Exclude<DoctorStatusFilter, 'ALL'> } : {}),
          ...(normalizedDepartment ? { department: { contains: normalizedDepartment, mode: 'insensitive' as const } } : {}),
          ...(normalizedSpecialization ? { specializations: { has: normalizedSpecialization } } : {}),
          ...(normalizedSearch
            ? {
                OR: [
                  { registrationNumber: { contains: normalizedSearch, mode: 'insensitive' as const } },
                  { medicalCouncilName: { contains: normalizedSearch, mode: 'insensitive' as const } },
                  { department: { contains: normalizedSearch, mode: 'insensitive' as const } },
                  { specializations: { has: normalizedSearch } },
                ],
              }
            : {}),
        },
      },
      ...(normalizedSearch
        ? {
            OR: [
              { firstName: { contains: normalizedSearch, mode: 'insensitive' as const } },
              { middleName: { contains: normalizedSearch, mode: 'insensitive' as const } },
              { lastName: { contains: normalizedSearch, mode: 'insensitive' as const } },
              { email: { contains: normalizedSearch, mode: 'insensitive' as const } },
              { phone: { contains: normalizedSearch, mode: 'insensitive' as const } },
              { doctorProfile: { is: { registrationNumber: { contains: normalizedSearch, mode: 'insensitive' as const } } } },
              { doctorProfile: { is: { medicalCouncilName: { contains: normalizedSearch, mode: 'insensitive' as const } } } },
            ],
          }
        : {}),
    }

    const orderBy =
      sortBy === 'NAME'
        ? [{ firstName: sortOrder as SortOrder }, { lastName: sortOrder as SortOrder }]
        : sortBy === 'STATUS'
          ? { doctorProfile: { verificationStatus: sortOrder as SortOrder } }
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
          doctorProfile: {
            select: {
              id: true,
              registrationNumber: true,
              medicalCouncilName: true,
              specializations: true,
              degrees: true,
              consultationFee: true,
              department: true,
              designation: true,
              employmentType: true,
              verificationStatus: true,
              createdAt: true,
              availability: {
                select: { id: true, isAvailable: true },
              },
              documents: {
                select: { id: true, verifiedAt: true },
              },
            },
          },
        },
        orderBy,
        skip: skipNum,
        take: limitNum,
      }),
      prisma.user.count({ where }),
    ])

    const data = users.map((user) => ({
      id: user.id,
      fullName: getUserDisplayName(user),
      email: user.email,
      phone: user.phone,
      profileImage: user.profileImage,
      emailVerified: user.emailVerified,
      accountStatus: user.accountStatus,
      createdAt: user.createdAt.toISOString(),
      doctorProfile: user.doctorProfile
        ? {
            id: user.doctorProfile.id,
            registrationNumber: user.doctorProfile.registrationNumber,
            medicalCouncilName: user.doctorProfile.medicalCouncilName,
            specializations: user.doctorProfile.specializations,
            degrees: user.doctorProfile.degrees,
            consultationFee: Number(user.doctorProfile.consultationFee ?? 0),
            department: user.doctorProfile.department,
            designation: user.doctorProfile.designation,
            employmentType: user.doctorProfile.employmentType,
            verificationStatus: user.doctorProfile.verificationStatus,
            submittedAt: user.doctorProfile.createdAt.toISOString(),
            availableSlotCount: user.doctorProfile.availability.filter((slot) => slot.isAvailable).length,
            documentCount: user.doctorProfile.documents.length,
            verifiedDocumentCount: user.doctorProfile.documents.filter((document) => document.verifiedAt).length,
          }
        : null,
    }))

    return res.status(200).json({
      success: true,
      data,
      pagination: {
        skip: skipNum,
        limit: limitNum,
        total,
        hasMore: skipNum + data.length < total,
      },
    })
  } catch (error) {
    console.error('List doctors error:', error)
    return res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}
