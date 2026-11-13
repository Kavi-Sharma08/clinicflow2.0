import { type Request, type Response } from 'express';
import { prisma } from '../../../../db/db.js';

export const getAdminFinancialTransactionsController = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 15));
    const skip = (page - 1) * limit;

    const [orders, totalCount] = await Promise.all([
      prisma.paymentOrder.findMany({
        include: {
          appointment: {
            select: {
              id: true,
              appointmentDate: true,
              queueNumber: true,
              status: true,
              isGuest: true,
              guestName: true,
              doctor: {
                select: {
                  department: true,
                  user: {
                    select: {
                      firstName: true,
                      lastName: true,
                    },
                  },
                },
              },
              patient: {
                select: {
                  user: {
                    select: {
                      firstName: true,
                      lastName: true,
                    },
                  },
                },
              },
            },
          },
          attempts: {
            select: {
              id: true,
              razorpayPaymentId: true,
              status: true,
              amountPaise: true,
              method: true,
              createdAt: true,
            },
          },
          refundRecords: {
            select: {
              id: true,
              razorpayRefundId: true,
              amountPaise: true,
              reason: true,
              status: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.paymentOrder.count(),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (error) {
    console.error('[AdminFinancialTransactions] Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve transactions' });
  }
};
