import { type Request, type Response } from 'express'
import { generateUploadSignature } from '../../../services/cloudinary.service.js'

const ALLOWED_SUBFOLDERS = ['license', 'govt-id'] as const

export const getUploadSignature = (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const { subfolder } = req.query

    if (typeof subfolder !== 'string' || !ALLOWED_SUBFOLDERS.includes(subfolder as any)) {
      return res.status(400).json({
        success: false,
        message: `subfolder must be one of: ${ALLOWED_SUBFOLDERS.join(', ')}`,
      })
    }

    const signatureData = generateUploadSignature({
      folder: `doctor-verification/${userId}/${subfolder}`,
    })

    return res.status(200).json({ success: true, data: signatureData })
  } catch (error) {
    console.error('Get upload signature error:', error)
    return res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}