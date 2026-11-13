import { type Request, type Response } from 'express';
import { prisma } from '../../../db/db.js';

export const getDoctorPayoutsSummaryController = async (req: Request, res: Response) => {
  try {
    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { userId: req.user!.id },
      select: { id: true },
    });

    if (!doctorProfile) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    }

    const doctorId = doctorProfile.id;

    // Aggregate ledger records
    const ledgerRecords = await prisma.doctorSettlementLedger.findMany({
      where: { doctorId },
      include: {
        paymentOrder: true,
      },
    });

    let totalGrossPaise = 0;
    let totalPlatformFeePaise = 0;
    let totalAllocatedPaise = 0;
    let eligiblePaise = 0;
    let pendingCompletionPaise = 0;
    let onHoldPaise = 0;
    let settledPaise = 0;

    for (const record of ledgerRecords) {
      const allocated = record.allocatedAmountPaise;
      totalAllocatedPaise += allocated;

      if (record.paymentOrder) {
        totalGrossPaise += record.paymentOrder.grossAmountPaise;
        totalPlatformFeePaise += record.paymentOrder.platformFeePaise;
      }

      switch (record.settlementStatus) {
        case 'ELIGIBLE':
          eligiblePaise += allocated;
          break;
        case 'PENDING_COMPLETION':
          pendingCompletionPaise += allocated;
          break;
        case 'ON_HOLD_PENDING_REVIEW':
          onHoldPaise += allocated;
          break;
        case 'SETTLED':
          settledPaise += allocated;
          break;
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalGrossPaise,
          totalPlatformFeePaise,
          totalAllocatedPaise,
          eligiblePaise,
          pendingCompletionPaise,
          onHoldPaise,
          settledPaise,
          currency: 'INR',
        },
      },
    });
  } catch (error) {
    console.error('[DoctorPayouts] getDoctorPayoutsSummary error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve payout summary' });
  }
};

export const getDoctorPayoutTransactionsController = async (req: Request, res: Response) => {
  try {
    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { userId: req.user!.id },
      select: { id: true },
    });

    if (!doctorProfile) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    }

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 15));
    const skip = (page - 1) * limit;

    const [transactions, totalCount] = await Promise.all([
      prisma.doctorSettlementLedger.findMany({
        where: { doctorId: doctorProfile.id },
        include: {
          appointment: {
            select: {
              id: true,
              appointmentDate: true,
              queueNumber: true,
              status: true,
              isGuest: true,
              guestName: true,
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
          paymentOrder: {
            select: {
              razorpayOrderId: true,
              grossAmountPaise: true,
              platformFeePaise: true,
              doctorSharePaise: true,
              currency: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.doctorSettlementLedger.count({
        where: { doctorId: doctorProfile.id },
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        transactions,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (error) {
    console.error('[DoctorPayouts] getDoctorPayoutTransactions error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve payout transactions' });
  }
};
