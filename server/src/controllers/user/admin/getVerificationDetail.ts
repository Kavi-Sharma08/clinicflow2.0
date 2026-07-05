import { type Request, type Response } from 'express'
import { prisma } from '../../../db/db.js'
import { getUserDisplayName } from '../../../utils/userDisplay.js'

const toISODate = (value: Date | null): string | null => value ? value.toISOString() : null
const toMoney = (value: unknown): number => Number(value ?? 0)

type AppointmentLike = {
  status: 'BOOKED' | 'COMPLETED' | 'CANCELLED'
  appointmentDate: Date
}

const getAppointmentSummary = (appointments: AppointmentLike[]) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return {
    total: appointments.length,
    upcoming: appointments.filter((appointment) => appointment.appointmentDate >= today && appointment.status === 'BOOKED').length,
    completed: appointments.filter((appointment) => appointment.status === 'COMPLETED').length,
    cancelled: appointments.filter((appointment) => appointment.status === 'CANCELLED').length,
  }
}

export const getVerificationDetail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid doctor id' })
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        middleName: true,
        lastName: true,
        email: true,
        phone: true,
        alternatePhone: true,
        gender: true,
        dateOfBirth: true,
        bloodGroup: true,
        nationality: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        country: true,
        postalCode: true,
        profileImage: true,
        role: true,
        accountStatus: true,
        emailVerified: true,
        phoneVerified: true,
        createdAt: true,
        updatedAt: true,
        doctorProfile: {
          include: {
            documents: {
              orderBy: { uploadedAt: 'desc' },
            },
            availability: {
              orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
            },
            appointments: {
              select: {
                status: true,
                appointmentDate: true,
              },
            },
          },
        },
      },
    })

    if (!user) {
      return res.status(404).json({ success: false, message: 'Doctor not found' })
    }

    if (user.role !== 'DOCTOR') {
      return res.status(400).json({ success: false, message: 'This user is not a doctor' })
    }

    const profile = user.doctorProfile

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          firstName: user.firstName,
          middleName: user.middleName,
          lastName: user.lastName,
          fullName: getUserDisplayName(user),
          email: user.email,
          phone: user.phone,
          alternatePhone: user.alternatePhone,
          gender: user.gender,
          dateOfBirth: toISODate(user.dateOfBirth),
          bloodGroup: user.bloodGroup,
          nationality: user.nationality,
          addressLine1: user.addressLine1,
          addressLine2: user.addressLine2,
          city: user.city,
          state: user.state,
          country: user.country,
          postalCode: user.postalCode,
          profileImage: user.profileImage,
          role: user.role,
          accountStatus: user.accountStatus,
          emailVerified: user.emailVerified,
          phoneVerified: user.phoneVerified,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        },
        verificationStatus: profile?.verificationStatus ?? 'NOT_SUBMITTED',
        doctorProfile: profile
          ? {
              id: profile.id,
              userId: profile.userId,
              registrationNumber: profile.registrationNumber,
              medicalCouncilName: profile.medicalCouncilName,
              specializations: profile.specializations,
              degrees: profile.degrees,
              certifications: profile.certifications,
              biography: profile.biography,
              consultationFee: toMoney(profile.consultationFee),
              practiceStartDate: profile.practiceStartDate.toISOString(),
              department: profile.department,
              designation: profile.designation,
              joiningDate: profile.joiningDate.toISOString(),
              employmentType: profile.employmentType,
              verificationStatus: profile.verificationStatus,
              createdAt: profile.createdAt.toISOString(),
              updatedAt: profile.updatedAt.toISOString(),
              documents: profile.documents.map((document) => ({
                id: document.id,
                documentType: document.documentType,
                fileUrl: document.fileUrl,
                remarks: document.remarks,
                uploadedAt: document.uploadedAt.toISOString(),
                verifiedAt: toISODate(document.verifiedAt),
                verifiedById: document.verifiedById,
              })),
              availability: profile.availability.map((slot) => ({
                id: slot.id,
                dayOfWeek: slot.dayOfWeek,
                startTime: slot.startTime,
                endTime: slot.endTime,
                isAvailable: slot.isAvailable,
                maxAppointments: slot.maxAppointments,
              })),
              appointmentSummary: getAppointmentSummary(profile.appointments),
            }
          : null,
      },
    })
  } catch (error) {
    console.error('Get verification detail error:', error)
    return res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}
