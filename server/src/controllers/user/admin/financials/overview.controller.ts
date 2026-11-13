import { type Request, type Response } from 'express';
import { prisma } from '../../../../db/db.js';

export const getAdminFinancialOverviewController = async (_req: Request, res: Response) => {
  try {
    const [ordersAggregate, ledgerAggregate, refundsAggregate] = await Promise.all([
      // Total orders that succeeded
      prisma.paymentOrder.aggregate({
        where: { status: 'SUCCESS' },
        _sum: {
          grossAmountPaise: true,
          platformFeePaise: true,
          doctorSharePaise: true,
        },
        _count: { id: true },
      }),
      // Settlements by status
      prisma.doctorSettlementLedger.groupBy({
        by: ['settlementStatus'],
        _sum: { allocatedAmountPaise: true },
        _count: { id: true },
      }),
      // Total refunds processed / requested
      prisma.refundRecord.aggregate({
        _sum: { amountPaise: true },
        _count: { id: true },
      }),
    ]);

    let eligiblePaise = 0;
    let pendingCompletionPaise = 0;
    let onHoldPaise = 0;
    let settledPaise = 0;

    for (const group of ledgerAggregate) {
      const sum = group._sum.allocatedAmountPaise || 0;
      switch (group.settlementStatus) {
        case 'ELIGIBLE':
          eligiblePaise += sum;
          break;
        case 'PENDING_COMPLETION':
          pendingCompletionPaise += sum;
          break;
        case 'ON_HOLD_PENDING_REVIEW':
          onHoldPaise += sum;
          break;
        case 'SETTLED':
          settledPaise += sum;
          break;
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        totalGrossVolumePaise: ordersAggregate._sum.grossAmountPaise || 0,
        totalPlatformCommissionPaise: ordersAggregate._sum.platformFeePaise || 0,
        totalDoctorAllocationsPaise: ordersAggregate._sum.doctorSharePaise || 0,
        successfulOrdersCount: ordersAggregate._count.id,
        settlements: {
          eligiblePaise,
          pendingCompletionPaise,
          onHoldPaise,
          settledPaise,
        },
        refunds: {
          totalRefundPaise: refundsAggregate._sum.amountPaise || 0,
          totalRefundCount: refundsAggregate._count.id,
        },
        currency: 'INR',
      },
    });
  } catch (error) {
    console.error('[AdminFinancialOverview] Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve financial overview' });
  }
};
