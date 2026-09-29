import { v2 as cloudinary } from 'cloudinary'
import { env } from '../config/env.js'

cloudinary.config({
  cloud_name: env.CLOUDINARY.CLOUD_NAME,
  api_key: env.CLOUDINARY.API_KEY,
  api_secret: env.CLOUDINARY.API_SECRET,
})

interface UploadSignatureParams {
  folder: string
}

export const generateUploadSignature = ({ folder }: UploadSignatureParams) => {
  const timestamp = Math.round(Date.now() / 1000)

  const paramsToSign = { timestamp, folder }

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    env.CLOUDINARY.API_SECRET
  )

  return {
    timestamp,
    signature,
    cloudName: env.CLOUDINARY.CLOUD_NAME,
    apiKey: env.CLOUDINARY.API_KEY,
    folder,
  }
}