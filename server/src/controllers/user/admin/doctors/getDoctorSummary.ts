import { type Request, type Response } from 'express'
import { prisma } from '../../../../db/db.js'

export const getDoctorSummary = async (_req: Request, res: Response) => {
  try {
    const [pendingDoctors, verifiedDoctors, rejectedDoctors, activeAvailability, totalDoctors] = await Promise.all([
      prisma.doctorProfile.count({ where: { verificationStatus: 'PENDING' } }),
      prisma.doctorProfile.count({ where: { verificationStatus: 'VERIFIED' } }),
      prisma.doctorProfile.count({ where: { verificationStatus: 'REJECTED' } }),
      prisma.doctorAvailability.count({ where: { isAvailable: true } }),
      prisma.doctorProfile.count(),
    ])

    return res.status(200).json({
      success: true,
      data: {
        totalDoctors,
        pendingDoctors,
        verifiedDoctors,
        rejectedDoctors,
        activeAvailability,
      },
    })
  } catch (error) {
    console.error('Doctor summary error:', error)
    return res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}
