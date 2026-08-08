import type { Request, Response } from 'express'
import { changePassword, requestPasswordReset, resetPassword } from '../../services/password.service.js'

export const handleChangePassword = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' })
    }

    const { oldPassword, currentPassword, newPassword } = req.body
    const pwdToVerify = currentPassword || oldPassword

    const result = await changePassword(req.user.id, pwdToVerify, newPassword)

    if (!result.success) {
      return res.status(result.status).json({
        success: false,
        field: result.field,
        message: result.message,
      })
    }

    return res.status(200).json({
      success: true,
      message: result.message,
    })
  } catch (error) {
    console.error('handleChangePassword error:', error)
    return res.status(500).json({ success: false, message: 'Something went wrong while updating password' })
  }
}

export const handleForgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body

    const result = await requestPasswordReset(email)

    if (!result.success) {
      return res.status(result.status).json({
        success: false,
        field: result.field,
        message: result.message,
      })
    }

    return res.status(200).json({
      success: true,
      message: result.message,
    })
  } catch (error) {
    console.error('handleForgotPassword error:', error)
    return res.status(500).json({ success: false, message: 'Something went wrong processing your request' })
  }
}

export const handleResetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body

    const result = await resetPassword(token, newPassword)

    if (!result.success) {
      return res.status(result.status).json({
        success: false,
        field: result.field,
        message: result.message,
      })
    }

    return res.status(200).json({
      success: true,
      message: result.message,
    })
  } catch (error) {
    console.error('handleResetPassword error:', error)
    return res.status(500).json({ success: false, message: 'Something went wrong while resetting password' })
  }
}
