import { type Request, type Response } from 'express';
import { prisma } from '../../../../db/db.js';

export const getAdminSettlementLedgerController = async (req: Request, res: Response) => {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const doctorId = typeof req.query.doctorId === 'string' ? req.query.doctorId : undefined;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 15));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.settlementStatus = status;
    if (doctorId) where.doctorId = doctorId;

    const [entries, totalCount] = await Promise.all([
      prisma.doctorSettlementLedger.findMany({
        where,
        include: {
          doctor: {
            select: {
              id: true,
              department: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
          appointment: {
            select: {
              id: true,
              appointmentDate: true,
              queueNumber: true,
              status: true,
              isGuest: true,
              guestName: true,
            },
          },
          paymentOrder: {
            select: {
              razorpayOrderId: true,
              grossAmountPaise: true,
              platformFeePaise: true,
              doctorSharePaise: true,
            },
          },
          authorizedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.doctorSettlementLedger.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        entries,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (error) {
    console.error('[AdminSettlementLedger] Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve settlement ledger' });
  }
};

/**
 * Approve eligible doctor settlements for payout
 */
export const approveSettlementBatchController = async (req: Request, res: Response) => {
  try {
    const { ledgerIds, notes } = req.body as {
      ledgerIds?: string[];
      notes?: string;
    };

    if (!ledgerIds || !Array.isArray(ledgerIds) || ledgerIds.length === 0) {
      return res.status(400).json({ success: false, message: 'ledgerIds array is required' });
    }

    const adminUserId = req.user!.id;

    const updatedResult = await prisma.$transaction(async (tx) => {
      const eligibleEntries = await tx.doctorSettlementLedger.findMany({
        where: {
          id: { in: ledgerIds },
          settlementStatus: 'ELIGIBLE',
        },
      });

      if (eligibleEntries.length === 0) {
        throw { status: 400, message: 'No entries in ELIGIBLE status found to approve' };
      }

      const eligibleIds = eligibleEntries.map((e) => e.id);

      await tx.doctorSettlementLedger.updateMany({
        where: { id: { in: eligibleIds } },
        data: {
          settlementStatus: 'APPROVED',
          authorizedById: adminUserId,
        },
      });

      await tx.financialAuditLog.create({
        data: {
          targetEntity: 'SETTLEMENT',
          targetId: eligibleIds[0]!,
          action: 'APPROVE_SETTLEMENT_BATCH',
          performedById: adminUserId,
          reason: notes?.trim() || null,
          metadata: {
            approvedLedgerIds: eligibleIds,
            approvedCount: eligibleIds.length,
            totalApprovedPaise: eligibleEntries.reduce((sum, e) => sum + e.allocatedAmountPaise, 0),
          },
        },
      });

      return {
        approvedCount: eligibleIds.length,
        approvedIds: eligibleIds,
      };
    });

    return res.status(200).json({
      success: true,
      message: `Successfully approved ${updatedResult.approvedCount} settlement entries`,
      data: updatedResult,
    });
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    console.error('[AdminSettlementApprove] Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to approve settlements' });
  }
};

/**
 * Confirm actual manual payout with reference proof (e.g. Bank UTR / NEFT reference)
 * Transitions from APPROVED -> SETTLED
 */
export const releaseSettlementBatchController = async (req: Request, res: Response) => {
  try {
    const { ledgerIds, payoutReference, payoutProofUrl, notes } = req.body as {
      ledgerIds?: string[];
      payoutReference?: string;
      payoutProofUrl?: string;
      notes?: string;
    };

    if (!ledgerIds || !Array.isArray(ledgerIds) || ledgerIds.length === 0) {
      return res.status(400).json({ success: false, message: 'ledgerIds array is required' });
    }

    if (!payoutReference || !payoutReference.trim()) {
      return res.status(400).json({
        success: false,
        message: 'payoutReference (UTR / transaction reference) is required to confirm actual settlement',
      });
    }

    const adminUserId = req.user!.id;

    const updatedResult = await prisma.$transaction(async (tx) => {
      // Find entries that are in APPROVED or ELIGIBLE status
      const entriesToSettle = await tx.doctorSettlementLedger.findMany({
        where: {
          id: { in: ledgerIds },
          settlementStatus: { in: ['APPROVED', 'ELIGIBLE'] },
        },
      });

      if (entriesToSettle.length === 0) {
        throw { status: 400, message: 'No entries in APPROVED or ELIGIBLE status found to settle' };
      }

      const settleIds = entriesToSettle.map((e) => e.id);

      // Mark settled with real proof
      await tx.doctorSettlementLedger.updateMany({
        where: { id: { in: settleIds } },
        data: {
          settlementStatus: 'SETTLED',
          transferSettledAt: new Date(),
          payoutReference: payoutReference.trim(),
          payoutProofUrl: payoutProofUrl?.trim() || null,
          authorizedById: adminUserId,
        },
      });

      // Write financial audit log
      await tx.financialAuditLog.create({
        data: {
          targetEntity: 'SETTLEMENT',
          targetId: settleIds[0]!,
          action: 'CONFIRM_MANUAL_SETTLEMENT',
          performedById: adminUserId,
          reason: notes?.trim() || null,
          metadata: {
            settledLedgerIds: settleIds,
            settledCount: settleIds.length,
            payoutReference: payoutReference.trim(),
            payoutProofUrl: payoutProofUrl?.trim() || null,
            totalSettledPaise: entriesToSettle.reduce((sum, e) => sum + e.allocatedAmountPaise, 0),
          },
        },
      });

      return {
        settledCount: settleIds.length,
        settledIds: settleIds,
      };
    });

    return res.status(200).json({
      success: true,
      message: `Successfully confirmed settlement for ${updatedResult.settledCount} entries with reference ${payoutReference.trim()}`,
      data: updatedResult,
    });
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    console.error('[AdminSettlementRelease] Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to release settlements' });
  }
};
