import { type Request, type Response } from 'express'
import { prisma } from '../../../db/db.js'
import { notifyRole } from '../../../services/notification.service.js'

const ALLOWED_EMPLOYMENT_TYPES = ['FULL_TIME', 'PART_TIME', 'VISITING'] as const
const ALLOWED_DOCUMENT_TYPES = ['MEDICAL_LICENSE', 'GOVERNMENT_ID', 'DEGREE_CERTIFICATE', 'CERTIFICATION', 'OTHER'] as const

type EmploymentTypeInput = (typeof ALLOWED_EMPLOYMENT_TYPES)[number]
type DoctorDocumentTypeInput = (typeof ALLOWED_DOCUMENT_TYPES)[number]

type DocumentInput = {
  documentType?: DoctorDocumentTypeInput
  fileUrl?: string
  remarks?: string
}

const ensureStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map((item) => item.trim())
}

const parseRequiredDate = (value: unknown, field: string) => {
  if (!value || typeof value !== 'string') {
    return { ok: false as const, field, message: `${field} is required` }
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return { ok: false as const, field, message: `${field} must be a valid date` }
  }
  return { ok: true as const, value: date }
}

export const submitVerification = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
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

    if (!registrationNumber || typeof registrationNumber !== 'string') {
      return res.status(400).json({ success: false, field: 'registrationNumber', message: 'Registration number is required' })
    }
    if (!medicalCouncilName || typeof medicalCouncilName !== 'string') {
      return res.status(400).json({ success: false, field: 'medicalCouncilName', message: 'Medical council name is required' })
    }
    if (!department || typeof department !== 'string') {
      return res.status(400).json({ success: false, field: 'department', message: 'Department is required' })
    }
    if (!employmentType || !ALLOWED_EMPLOYMENT_TYPES.includes(employmentType)) {
      return res.status(400).json({ success: false, field: 'employmentType', message: `Employment type must be one of: ${ALLOWED_EMPLOYMENT_TYPES.join(', ')}` })
    }

    const parsedPracticeStartDate = parseRequiredDate(practiceStartDate, 'practiceStartDate')
    if (!parsedPracticeStartDate.ok) {
      return res.status(400).json({ success: false, field: parsedPracticeStartDate.field, message: parsedPracticeStartDate.message })
    }

    const parsedJoiningDate = parseRequiredDate(joiningDate, 'joiningDate')
    if (!parsedJoiningDate.ok) {
      return res.status(400).json({ success: false, field: parsedJoiningDate.field, message: parsedJoiningDate.message })
    }

    const fee = Number(consultationFee)
    if (!Number.isFinite(fee) || fee < 0) {
      return res.status(400).json({ success: false, field: 'consultationFee', message: 'Consultation fee must be a valid positive number' })
    }

    const normalizedSpecializations = ensureStringArray(specializations)
    const normalizedDegrees = ensureStringArray(degrees)
    const normalizedCertifications = ensureStringArray(certifications)

    if (normalizedSpecializations.length === 0) {
      return res.status(400).json({ success: false, field: 'specializations', message: 'At least one specialization is required' })
    }
    if (normalizedDegrees.length === 0) {
      return res.status(400).json({ success: false, field: 'degrees', message: 'At least one degree is required' })
    }

    const normalizedDocuments = Array.isArray(documents) ? documents as DocumentInput[] : []
    const invalidDocument = normalizedDocuments.find((document) =>
      !document.documentType || !ALLOWED_DOCUMENT_TYPES.includes(document.documentType) || !document.fileUrl
    )

    if (invalidDocument || normalizedDocuments.length === 0) {
      return res.status(400).json({
        success: false,
        field: 'documents',
        message: 'At least one valid document is required',
      })
    }

    const existing = await prisma.doctorProfile.findUnique({ where: { userId } })

    if (existing && existing.verificationStatus === 'VERIFIED') {
      return res.status(409).json({ success: false, message: 'Your account is already verified' })
    }

    const profile = await prisma.$transaction(async (tx) => {
      const savedProfile = await tx.doctorProfile.upsert({
        where: { userId },
        create: {
          userId,
          registrationNumber: registrationNumber.trim(),
          medicalCouncilName: medicalCouncilName.trim(),
          specializations: normalizedSpecializations,
          degrees: normalizedDegrees,
          certifications: normalizedCertifications,
          biography: typeof biography === 'string' && biography.trim() ? biography.trim() : null,
          consultationFee: fee,
          practiceStartDate: parsedPracticeStartDate.value,
          department: department.trim(),
          designation: typeof designation === 'string' && designation.trim() ? designation.trim() : null,
          joiningDate: parsedJoiningDate.value,
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
          practiceStartDate: parsedPracticeStartDate.value,
          department: department.trim(),
          designation: typeof designation === 'string' && designation.trim() ? designation.trim() : null,
          joiningDate: parsedJoiningDate.value,
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
          remarks: document.remarks?.trim() || null,
        })),
      })

      return savedProfile
    })

    await notifyRole('ADMIN', {
      type: 'DOCTOR_PROFILE_SUBMITTED',
      priority: 'HIGH',
      title: 'Doctor verification submitted',
      message: 'A doctor submitted profile details for admin review.',
      entityType: 'doctorProfile',
      entityId: profile.id,
      metadata: { doctorProfileId: profile.id, verificationStatus: profile.verificationStatus },
    })

    return res.status(201).json({
      success: true,
      message: 'Verification details submitted. We will review your application shortly.',
      data: { verificationStatus: profile.verificationStatus },
    })
  } catch (error) {
    console.error('Submit doctor verification error:', error)
    return res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}
