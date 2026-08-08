import { Router } from 'express'
import { signup } from '../controllers/auth/signup.controller.js'
import { login } from '../controllers/auth/login.controller.js'
import { verifyEmail } from '../controllers/auth/verifyEmail.controller.js'
import { me } from '../controllers/auth/me.controller.js'
import { resendOtp } from '../controllers/auth/resendOtp.controller.js'
import { logout } from '../controllers/auth/logout.controller.js'
import { requireAuth } from '../middlewares/requireAuth.middleware.js'
import { handleChangePassword, handleForgotPassword, handleResetPassword } from '../controllers/auth/password.controller.js'

const router = Router()

router.post('/signup', signup)
router.post('/login', login)
router.post('/verify-email', verifyEmail)
router.get('/me', requireAuth, me) 
router.post('/resend-otp', resendOtp)
router.post('/logout', requireAuth, logout)

router.post('/change-password', requireAuth, handleChangePassword)
router.post('/forgot-password', handleForgotPassword)
router.post('/reset-password', handleResetPassword)

export default router