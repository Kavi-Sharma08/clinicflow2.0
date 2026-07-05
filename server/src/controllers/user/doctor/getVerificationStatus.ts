import { type Request, type Response } from 'express'
import { prisma } from '../../../db/db.js'

export const getVerificationStatus = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id

    const profile = await prisma.doctorProfile.findUnique({
      where: { userId },
      select: {
        verificationStatus: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!profile) {
      return res.status(200).json({
        success: true,
        data: { verificationStatus: 'NOT_SUBMITTED' },
      })
    }

    return res.status(200).json({
      success: true,
      data: {
        verificationStatus: profile.verificationStatus,
        submittedAt: profile.createdAt.toISOString(),
        updatedAt: profile.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Get doctor verification status error:', error)
    return res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}
