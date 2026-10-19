import { type Request, type Response } from 'express'
import { prisma } from '../../../db/db.js'
import { env } from '../../../config/env.js'
import { generateDoctorSlug } from '../../../services/guestBooking.service.js'

export const getDoctorQrCodeDetails = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id

    let doctor = await prisma.doctorProfile.findUnique({
      where: { userId },
      include: {
        user: true,
        availability: { where: { isAvailable: true } },
      },
    })

    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found.' })
    }

    // Auto-generate safe slug if not yet set
    if (!doctor.slug) {
      const newSlug = generateDoctorSlug(doctor.user.firstName, doctor.user.lastName, doctor.id)
      doctor = await prisma.doctorProfile.update({
        where: { id: doctor.id },
        data: { slug: newSlug },
        include: {
          user: true,
          availability: { where: { isAvailable: true } },
        },
      })
    }

    const publicIdentifier = doctor.slug || doctor.id
    const bookingUrl = `${env.CLIENT_URL}/book/${publicIdentifier}`
    const isVerified = doctor.verificationStatus === 'VERIFIED'
    const hasAvailability = doctor.availability.length > 0

    return res.status(200).json({
      success: true,
      data: {
        doctorId: doctor.id,
        slug: publicIdentifier,
        bookingUrl,
        isVerified,
        verificationStatus: doctor.verificationStatus,
        hasAvailability,
        activeSlotsCount: doctor.availability.length,
        doctorName: `Dr. ${doctor.user.firstName} ${doctor.user.lastName || ''}`.trim(),
        department: doctor.department,
        clinicAddress: [doctor.user.addressLine1, doctor.user.city].filter(Boolean).join(', ') || null,
        instructions: !isVerified
          ? 'Your doctor profile is currently pending verification. The QR code will become active for patients once approved.'
          : !hasAvailability
          ? 'You have not configured any active consultation slots yet. Add availability in the Availability tab before displaying the QR code.'
          : 'Display this QR code at your clinic reception or on appointment cards for quick guest bookings.',
      },
    })
  } catch (error) {
    console.error('Get doctor QR code error:', error)
    return res.status(500).json({ success: false, message: 'Failed to retrieve QR code details.' })
  }
}
