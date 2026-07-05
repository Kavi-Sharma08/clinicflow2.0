import { type Request, type Response } from 'express'
import { prisma } from '../../db/db.js'

export const listMyNotifications = async (req: Request, res: Response) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit ?? 20), 1), 50)
    const notifications = await prisma.notification.findMany({
      where: { recipientId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
    const unreadCount = await prisma.notification.count({ where: { recipientId: req.user!.id, readAt: null } })
    return res.status(200).json({ success: true, data: notifications, meta: { unreadCount } })
  } catch (error) {
    console.error('List notifications error:', error)
    return res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}

export const markNotificationRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const notification = await prisma.notification.findFirst({ where: { id, recipientId: req.user!.id } })
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' })
    }
    const updated = await prisma.notification.update({ where: { id }, data: { readAt: new Date() } })
    return res.status(200).json({ success: true, data: updated })
  } catch (error) {
    console.error('Mark notification read error:', error)
    return res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}

export const markAllNotificationsRead = async (req: Request, res: Response) => {
  try {
    await prisma.notification.updateMany({ where: { recipientId: req.user!.id, readAt: null }, data: { readAt: new Date() } })
    return res.status(200).json({ success: true, message: 'Notifications marked as read' })
  } catch (error) {
    console.error('Mark all notifications read error:', error)
    return res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}
