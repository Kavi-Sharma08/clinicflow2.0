import { type Request, type Response } from 'express';
import { prisma } from '../../../../db/db.js';
import { getRazorpayClient } from '../../../../services/payment/razorpay.service.js';

export const getAdminRefundRequestsController = async (req: Request, res: Response) => {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 15));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [refunds, totalCount] = await Promise.all([
      prisma.refundRecord.findMany({
        where,
        include: {
          appointment: {
            select: {
              id: true,
              appointmentDate: true,
              queueNumber: true,
              status: true,
              isGuest: true,
              guestName: true,
              guestEmail: true,
              doctor: {
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
              confirmedPaymentId: true,
              grossAmountPaise: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.refundRecord.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        refunds,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (error) {
    console.error('[AdminRefundRequests] Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve refund requests' });
  }
};

export const processAdminRefundReviewController = async (req: Request, res: Response) => {
  try {
    const refundId = typeof req.params.refundId === 'string' ? req.params.refundId : undefined;
    const { action, adminNotes } = req.body as {
      action?: 'APPROVE' | 'REJECT';
      adminNotes?: string;
    };

    if (!refundId) {
      return res.status(400).json({ success: false, message: 'refundId is required' });
    }
    if (!action || !['APPROVE', 'REJECT'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Valid action (APPROVE or REJECT) is required' });
    }

    const refund = await prisma.refundRecord.findUnique({
      where: { id: refundId },
      include: {
        paymentOrder: true,
      },
    });

    if (!refund) {
      return res.status(404).json({ success: false, message: 'Refund record not found' });
    }

    if (refund.status === 'SUCCESS' || refund.status === 'REJECTED') {
      return res.status(409).json({ success: false, message: `Refund is already ${refund.status.toLowerCase()}` });
    }

    const adminUserId = req.user!.id;

    if (action === 'REJECT') {
      await prisma.$transaction(async (tx) => {
        await tx.refundRecord.update({
          where: { id: refundId },
          data: {
            status: 'REJECTED',
            rejectionReason: adminNotes?.trim() || 'Rejected by admin',
            reviewedById: adminUserId,
            reviewedAt: new Date(),
          },
        });

        await tx.financialAuditLog.create({
          data: {
            targetEntity: 'REFUND',
            targetId: refundId,
            action: 'REJECT_REFUND',
            performedById: adminUserId,
            reason: adminNotes?.trim() || null,
            metadata: {
              previousStatus: refund.status,
            },
          },
        });
      });

      return res.status(200).json({ success: true, message: 'Refund request rejected' });
    }

    // APPROVE action: Invoke Razorpay Refund API OUTSIDE of DB transaction
    const targetPaymentId = refund.paymentOrder.confirmedPaymentId;
    if (!targetPaymentId) {
      return res.status(400).json({
        success: false,
        message: 'No captured payment ID found associated with this refund',
      });
    }

    const idempotencyKey = refund.idempotencyKey || `ref_rev_${refund.id}_${Date.now()}`;
    const razorpay = getRazorpayClient();

    let razorpayRefund: any;
    try {
      razorpayRefund = await razorpay.payments.refund(targetPaymentId, {
        amount: refund.amountPaise,
        notes: {
          refundRecordId: refund.id,
          appointmentId: refund.appointmentId,
          approvedBy: adminUserId,
        },
      } as any);
    } catch (apiError: any) {
      console.error('[AdminRefundReview] Razorpay refund API failed:', apiError);
      return res.status(502).json({
        success: false,
        message: apiError.error?.description || 'Gateway error processing refund',
      });
    }

    // Update DB with success and audit log
    await prisma.$transaction(async (tx) => {
      await tx.refundRecord.update({
        where: { id: refundId },
        data: {
          status: 'SUCCESS',
          razorpayRefundId: razorpayRefund.id,
          reviewedById: adminUserId,
          reviewedAt: new Date(),
        },
      });

      // Also set settlement ledger to NOT_APPLICABLE if applicable
      await tx.doctorSettlementLedger.updateMany({
        where: { appointmentId: refund.appointmentId },
        data: { settlementStatus: 'NOT_APPLICABLE' },
      });

      await tx.financialAuditLog.create({
        data: {
          targetEntity: 'REFUND',
          targetId: refundId,
          action: 'APPROVE_REFUND',
          performedById: adminUserId,
          metadata: {
            razorpayRefundId: razorpayRefund.id,
            amountPaise: refund.amountPaise,
            adminNotes,
          },
        },
      });
    });

    return res.status(200).json({
      success: true,
      message: 'Refund approved and executed successfully',
      data: {
        refundId: refund.id,
        razorpayRefundId: razorpayRefund.id,
        status: 'SUCCESS',
      },
    });
  } catch (error) {
    console.error('[AdminRefundReview] Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to process refund review' });
  }
};
