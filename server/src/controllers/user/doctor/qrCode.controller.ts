import { type Request, type Response } from 'express'
import { prisma } from '../../../db/db.js'
import { resolveClientBaseUrl } from '../../../config/env.js'
import { generateDoctorSlug } from '../../../services/guestBooking.service.js'

export const getDoctorQrCodeDetails = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Doctor not authenticated.' })
    }

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
      let newSlug = generateDoctorSlug(doctor.user.firstName, doctor.user.lastName, doctor.id)
      try {
        doctor = await prisma.doctorProfile.update({
          where: { id: doctor.id },
          data: { slug: newSlug },
          include: {
            user: true,
            availability: { where: { isAvailable: true } },
          },
        })
      } catch (err: any) {
        // Fallback for unexpected slug uniqueness conflict
        if (err?.code === 'P2002') {
          const fallbackSuffix = Math.random().toString(36).substring(2, 6)
          newSlug = `${newSlug}-${fallbackSuffix}`
          doctor = await prisma.doctorProfile.update({
            where: { id: doctor.id },
            data: { slug: newSlug },
            include: {
              user: true,
              availability: { where: { isAvailable: true } },
            },
          })
        } else {
          throw err
        }
      }
    }

    const publicIdentifier = doctor.slug || doctor.id
    const clientBaseUrl = resolveClientBaseUrl(req)
    const bookingUrl = `${clientBaseUrl}/book/${publicIdentifier}`
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
