import { type Request, type Response } from 'express'
import { prisma } from '../../../db/db.js'
import { getUserDisplayName } from '../../../utils/userDisplay.js'

const ALLOWED_EMPLOYMENT_TYPES = ['FULL_TIME', 'PART_TIME', 'VISITING'] as const
const ALLOWED_DOCUMENT_TYPES = ['MEDICAL_LICENSE', 'GOVERNMENT_ID', 'DEGREE_CERTIFICATE', 'CERTIFICATION', 'OTHER'] as const

type EmploymentTypeInput = (typeof ALLOWED_EMPLOYMENT_TYPES)[number]
type DoctorDocumentTypeInput = (typeof ALLOWED_DOCUMENT_TYPES)[number]

type DoctorDocumentInput = {
  documentType?: DoctorDocumentTypeInput
  fileUrl?: string
  fileName?: string
  mimeType?: string
  fileSize?: number
  remarks?: string
}

const ensureStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .map((item) => item.trim())
}

const parseDate = (value: unknown): Date | null => {
  if (!value || typeof value !== 'string') return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const serializeDoctorProfile = (profile: {
  id: string
  registrationNumber: string
  medicalCouncilName: string
  specializations: string[]
  degrees: string[]
  certifications: string[]
  biography: string | null
  consultationFee: { toString: () => string } | number | string
  practiceStartDate: Date
  department: string
  designation: string | null
  joiningDate: Date
  employmentType: string
  verificationStatus: string
  rejectionReason?: string | null
  submittedAt?: Date | null
  user: {
    firstName?: string | null
    middleName?: string | null
    lastName?: string | null
    email: string
    phone?: string | null
    profileImage?: string | null
  }
  documents: Array<{
    id: string
    documentType: string
    fileUrl: string
    fileName?: string | null
    mimeType?: string | null
    fileSize?: number | null
    remarks?: string | null
    uploadedAt: Date
    verifiedAt?: Date | null
  }>
  availability: Array<{
    id: string
    dayOfWeek: string
    startTime: string
    endTime: string
    isAvailable: boolean
    maxAppointments: number
  }>
}) => ({
  id: profile.id,
  fullName: getUserDisplayName(profile.user),
  email: profile.user.email,
  phone: profile.user.phone ?? null,
  profileImage: profile.user.profileImage ?? null,
  registrationNumber: profile.registrationNumber,
  medicalCouncilName: profile.medicalCouncilName,
  specializations: profile.specializations,
  degrees: profile.degrees,
  certifications: profile.certifications,
  biography: profile.biography,
  consultationFee: Number(profile.consultationFee),
  practiceStartDate: profile.practiceStartDate.toISOString(),
  department: profile.department,
  designation: profile.designation,
  joiningDate: profile.joiningDate.toISOString(),
  employmentType: profile.employmentType,
  verificationStatus: profile.verificationStatus,
  rejectionReason: profile.rejectionReason ?? null,
  submittedAt: profile.submittedAt?.toISOString() ?? null,
  documents: profile.documents.map((document) => ({
    id: document.id,
    documentType: document.documentType,
    fileUrl: document.fileUrl,
    fileName: document.fileName ?? null,
    mimeType: document.mimeType ?? null,
    fileSize: document.fileSize ?? null,
    remarks: document.remarks ?? null,
    uploadedAt: document.uploadedAt.toISOString(),
    verifiedAt: document.verifiedAt?.toISOString() ?? null,
  })),
  availability: profile.availability.map((slot) => ({
    id: slot.id,
    dayOfWeek: slot.dayOfWeek,
    startTime: slot.startTime,
    endTime: slot.endTime,
    isAvailable: slot.isAvailable,
    maxAppointments: slot.maxAppointments,
  })),
})

export const getMyDoctorProfile = async (req: Request, res: Response) => {
  try {
    const profile = await prisma.doctorProfile.findUnique({
      where: { userId: req.user!.id },
      include: {
        user: true,
        documents: { orderBy: { uploadedAt: 'desc' } },
        availability: { orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] },
      },
    })

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Doctor profile has not been submitted yet' })
    }

    return res.status(200).json({ success: true, data: serializeDoctorProfile(profile) })
  } catch (error) {
    console.error('Get my doctor profile error:', error)
    return res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}

export const updateMyDoctorProfile = async (req: Request, res: Response) => {
  try {
    const {
      registrationNumber,
      medicalCouncilName,
      specializations,
      degrees,
      certifications,
      biography,
      consultationFee,
      practiceStartDate,
      department,
      designation,
      joiningDate,
      employmentType,
      documents,
    } = req.body

    const parsedPracticeDate = parseDate(practiceStartDate)
    const parsedJoiningDate = parseDate(joiningDate)
    const normalizedSpecializations = ensureStringArray(specializations)
    const normalizedDegrees = ensureStringArray(degrees)
    const normalizedCertifications = ensureStringArray(certifications)
    const normalizedDocuments = Array.isArray(documents) ? (documents as DoctorDocumentInput[]) : []
    const fee = Number(consultationFee)

    if (!registrationNumber || typeof registrationNumber !== 'string') {
      return res.status(400).json({ success: false, field: 'registrationNumber', message: 'Registration number is required' })
    }
    if (!medicalCouncilName || typeof medicalCouncilName !== 'string') {
      return res.status(400).json({ success: false, field: 'medicalCouncilName', message: 'Medical council name is required' })
    }
    if (normalizedSpecializations.length === 0) {
      return res.status(400).json({ success: false, field: 'specializations', message: 'At least one specialization is required' })
    }
    if (normalizedDegrees.length === 0) {
      return res.status(400).json({ success: false, field: 'degrees', message: 'At least one degree is required' })
    }
    if (!Number.isFinite(fee) || fee < 0) {
      return res.status(400).json({ success: false, field: 'consultationFee', message: 'Consultation fee must be a valid amount' })
    }
    if (!department || typeof department !== 'string') {
      return res.status(400).json({ success: false, field: 'department', message: 'Department is required' })
    }
    if (!employmentType || !ALLOWED_EMPLOYMENT_TYPES.includes(employmentType)) {
      return res.status(400).json({ success: false, field: 'employmentType', message: `Employment type must be one of: ${ALLOWED_EMPLOYMENT_TYPES.join(', ')}` })
    }
    if (!parsedPracticeDate) {
      return res.status(400).json({ success: false, field: 'practiceStartDate', message: 'Practice start date is required' })
    }
    if (!parsedJoiningDate) {
      return res.status(400).json({ success: false, field: 'joiningDate', message: 'Joining date is required' })
    }

    const invalidDocument = normalizedDocuments.find((document) =>
      !document.documentType || !ALLOWED_DOCUMENT_TYPES.includes(document.documentType) || !document.fileUrl,
    )

    if (normalizedDocuments.length === 0 || invalidDocument) {
      return res.status(400).json({ success: false, field: 'documents', message: 'At least one valid document is required' })
    }

    const profile = await prisma.$transaction(async (tx) => {
      const savedProfile = await tx.doctorProfile.upsert({
        where: { userId: req.user!.id },
        create: {
          userId: req.user!.id,
          registrationNumber: registrationNumber.trim(),
          medicalCouncilName: medicalCouncilName.trim(),
          specializations: normalizedSpecializations,
          degrees: normalizedDegrees,
          certifications: normalizedCertifications,
          biography: typeof biography === 'string' && biography.trim() ? biography.trim() : null,
          consultationFee: fee,
          practiceStartDate: parsedPracticeDate,
          department: department.trim(),
          designation: typeof designation === 'string' && designation.trim() ? designation.trim() : null,
          joiningDate: parsedJoiningDate,
          employmentType: employmentType as EmploymentTypeInput,
          verificationStatus: 'PENDING',
        },
        update: {
          registrationNumber: registrationNumber.trim(),
          medicalCouncilName: medicalCouncilName.trim(),
          specializations: normalizedSpecializations,
          degrees: normalizedDegrees,
          certifications: normalizedCertifications,
          biography: typeof biography === 'string' && biography.trim() ? biography.trim() : null,
          consultationFee: fee,
          practiceStartDate: parsedPracticeDate,
          department: department.trim(),
          designation: typeof designation === 'string' && designation.trim() ? designation.trim() : null,
          joiningDate: parsedJoiningDate,
          employmentType: employmentType as EmploymentTypeInput,
          verificationStatus: 'PENDING',
        },
      })

      await tx.doctorDocument.deleteMany({ where: { doctorId: savedProfile.id } })
      await tx.doctorDocument.createMany({
        data: normalizedDocuments.map((document) => ({
          doctorId: savedProfile.id,
          documentType: document.documentType as DoctorDocumentTypeInput,
          fileUrl: document.fileUrl ?? '',
          fileName: document.fileName?.trim() || null,
          mimeType: document.mimeType?.trim() || null,
          fileSize: typeof document.fileSize === 'number' ? document.fileSize : null,
          remarks: document.remarks?.trim() || null,
        })),
      })

      return tx.doctorProfile.findUniqueOrThrow({
        where: { id: savedProfile.id },
        include: {
          user: true,
          documents: { orderBy: { uploadedAt: 'desc' } },
          availability: { orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] },
        },
      })
    })

    return res.status(200).json({ success: true, message: 'Doctor profile submitted for review', data: serializeDoctorProfile(profile) })
  } catch (error) {
    console.error('Update my doctor profile error:', error)
    return res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}
