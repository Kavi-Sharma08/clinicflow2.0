import { type Request, type Response } from 'express'
import { prisma } from '../../../db/db.js'
import { sendDoctorApprovedEmail } from '../../../services/email.service.js'
import { getUserDisplayName } from '../../../utils/userDisplay.js'
import { createNotification } from '../../../services/notification.service.js'

export const approveVerification = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const adminUserId = req.user!.id

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid doctor profile id' })
    }

    const profile = await prisma.doctorProfile.findUnique({
      where: { id },
      include: { user: true },
    })

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' })
    }

    if (profile.verificationStatus === 'VERIFIED') {
      return res.status(409).json({ success: false, message: 'This doctor is already verified' })
    }

    const updated = await prisma.$transaction(async (tx) => {
      const doctor = await tx.doctorProfile.update({
        where: { id },
        data: { verificationStatus: 'VERIFIED' },
      })

      await tx.doctorDocument.updateMany({
        where: { doctorId: id, verifiedAt: null },
        data: {
          verifiedAt: new Date(),
          verifiedById: adminUserId,
        },
      })

      return doctor
    })

    await sendDoctorApprovedEmail(profile.user.email, getUserDisplayName(profile.user))
    await createNotification({
      recipientId: profile.userId,
      type: 'DOCTOR_PROFILE_VERIFIED',
      priority: 'HIGH',
      title: 'Profile verified',
      message: 'Your doctor profile has been verified. Patients can now book appointments with you.',
      entityType: 'doctorProfile',
      entityId: profile.id,
    })

    return res.status(200).json({
      success: true,
      message: 'Doctor verified successfully',
      data: {
        id: updated.id,
        verificationStatus: updated.verificationStatus,
      },
    })
  } catch (error) {
    console.error('Approve verification error:', error)
    return res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}
