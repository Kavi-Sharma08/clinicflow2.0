import { Router } from 'express'
import { requireAuth } from '../middlewares/requireAuth.middleware.js'
import { listMyNotifications, markAllNotificationsRead, markNotificationRead } from '../controllers/notification/notification.controller.js'

const router = Router()

router.get('/', requireAuth, listMyNotifications)
router.patch('/read-all', requireAuth, markAllNotificationsRead)
router.patch('/:id/read', requireAuth, markNotificationRead)

export default router
