import { type Request, type Response } from 'express'
import { prisma } from '../../db/db.js'

export const me = async (req: Request, res: Response) => {
  try {
    const user = req.user!

    if (user.role !== 'DOCTOR') {
      return res.status(200).json({ success: true, data: user })
    }

    const profile = await prisma.doctorProfile.findUnique({
      where: { userId: user.id },
      select: { verificationStatus: true },
    })

    return res.status(200).json({
      success: true,
      data: {
        ...user,
        verificationStatus: profile?.verificationStatus ?? 'NOT_SUBMITTED',
      },
    })
  } catch (error) {
    console.error('Me controller error:', error)
    return res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}
