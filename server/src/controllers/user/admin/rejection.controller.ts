import { type Request, type Response } from 'express'
import { prisma } from '../../../db/db.js'
import { sendDoctorRejectedEmail } from '../../../services/email.service.js'
import { getUserDisplayName } from '../../../utils/userDisplay.js'
import { createNotification } from '../../../services/notification.service.js'

export const rejectVerification = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { reason } = req.body as { reason?: string }

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid doctor profile id' })
    }

    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        field: 'reason',
        message: 'Rejection reason must be at least 10 characters',
      })
    }

    const profile = await prisma.doctorProfile.findUnique({
      where: { id },
      include: { user: true },
    })

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' })
    }

    if (profile.verificationStatus === 'REJECTED') {
      return res.status(409).json({ success: false, message: 'This doctor is already rejected' })
    }

    const updated = await prisma.doctorProfile.update({
      where: { id },
      data: { verificationStatus: 'REJECTED' },
    })

    await sendDoctorRejectedEmail(profile.user.email, getUserDisplayName(profile.user), reason.trim())
    await createNotification({
      recipientId: profile.userId,
      type: 'DOCTOR_PROFILE_REJECTED',
      priority: 'HIGH',
      title: 'Profile needs changes',
      message: reason.trim(),
      entityType: 'doctorProfile',
      entityId: profile.id,
    })

    return res.status(200).json({
      success: true,
      message: 'Doctor rejected successfully',
      data: {
        id: updated.id,
        verificationStatus: updated.verificationStatus,
      },
    })
  } catch (error) {
    console.error('Reject verification error:', error)
    return res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}
