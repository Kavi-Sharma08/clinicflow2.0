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
              bookingReference: true,
              patient: {
                select: {
                  user: {
                    select: {
                      firstName: true,
                      lastName: true,
                      email: true,
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
 * Confirm payout / Mark as Paid (e.g. Bank UTR / NEFT reference or simulated payout in dev)
 * Transitions from ELIGIBLE / APPROVED -> SETTLED
 */
export const releaseSettlementBatchController = async (req: Request, res: Response) => {
  try {
    const { ledgerIds, payoutReference, payoutProofUrl, settlementMethod, notes } = req.body as {
      ledgerIds?: string[];
      payoutReference?: string;
      payoutProofUrl?: string;
      settlementMethod?: string;
      notes?: string;
    };

    if (!ledgerIds || !Array.isArray(ledgerIds) || ledgerIds.length === 0) {
      return res.status(400).json({ success: false, message: 'ledgerIds array is required' });
    }

    const isProduction = process.env.NODE_ENV === 'production';
    const isSimulated = !payoutReference || !payoutReference.trim();

    // Production strictly requires a genuine bank transfer / UTR reference
    if (isProduction && isSimulated) {
      return res.status(400).json({
        success: false,
        message: 'payoutReference (genuine UTR / bank reference) is required in production',
      });
    }

    if (isProduction && payoutReference && payoutReference.trim().toUpperCase().startsWith('SIM_')) {
      return res.status(400).json({
        success: false,
        message: 'Simulated payout references are not permitted in production',
      });
    }

    const effectivePayoutReference = !isSimulated
      ? payoutReference!.trim()
      : `SIM_PAY_${Date.now().toString(36).toUpperCase()}_${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const effectiveMethod = isSimulated
      ? 'SIMULATED_MANUAL_PAYOUT'
      : (settlementMethod?.trim() || 'MANUAL_BANK_TRANSFER');

    const adminUserId = req.user!.id;

    const updatedResult = await prisma.$transaction(async (tx) => {
      // 1. Prevent duplicate payouts: check if any requested ledger is already SETTLED
      const alreadySettled = await tx.doctorSettlementLedger.findMany({
        where: {
          id: { in: ledgerIds },
          settlementStatus: 'SETTLED',
        },
        select: { id: true, payoutReference: true },
      });

      if (alreadySettled.length > 0) {
        throw {
          status: 400,
          message: `Duplicate payout prevented: settlement ${alreadySettled[0]!.id} has already been marked as paid (ref: ${alreadySettled[0]!.payoutReference})`,
        };
      }

      // 2. Validate eligibility
      const entriesToSettle = await tx.doctorSettlementLedger.findMany({
        where: {
          id: { in: ledgerIds },
          settlementStatus: { in: ['APPROVED', 'ELIGIBLE'] },
        },
        include: {
          appointment: { select: { id: true } },
        },
      });

      if (entriesToSettle.length === 0) {
        throw { status: 400, message: 'No entries in ELIGIBLE or APPROVED status found to settle' };
      }

      const settleIds = entriesToSettle.map((e) => e.id);
      const totalSettledPaise = entriesToSettle.reduce((sum, e) => sum + e.allocatedAmountPaise, 0);
      const settledAt = new Date();

      // 3. Mark settled transactionally
      await tx.doctorSettlementLedger.updateMany({
        where: { id: { in: settleIds } },
        data: {
          settlementStatus: 'SETTLED',
          transferSettledAt: settledAt,
          payoutReference: effectivePayoutReference,
          payoutProofUrl: isSimulated ? 'SIMULATED_DEVELOPMENT_SETTLEMENT' : (payoutProofUrl?.trim() || null),
          authorizedById: adminUserId,
        },
      });

      // 4. Create financial audit log with complete details
      await tx.financialAuditLog.create({
        data: {
          targetEntity: 'SETTLEMENT',
          targetId: settleIds[0]!,
          action: 'MARK_AS_PAID',
          performedById: adminUserId,
          reason: notes?.trim() || (isSimulated ? 'Simulated payout in development' : 'Marked as paid by admin'),
          metadata: {
            adminId: adminUserId,
            settledLedgerIds: settleIds,
            settledCount: settleIds.length,
            totalSettledPaise,
            doctorIds: [...new Set(entriesToSettle.map((e) => e.doctorId))],
            appointmentIds: entriesToSettle.map((e) => e.appointmentId),
            payoutReference: effectivePayoutReference,
            settlementMethod: effectiveMethod,
            isSimulated,
            timestamp: settledAt.toISOString(),
          },
        },
      });

      // 5. Retrieve updated records to return state
      const updatedEntries = await tx.doctorSettlementLedger.findMany({
        where: { id: { in: settleIds } },
        select: {
          id: true,
          doctorId: true,
          appointmentId: true,
          allocatedAmountPaise: true,
          settlementStatus: true,
          payoutReference: true,
          transferSettledAt: true,
        },
      });

      return {
        settledCount: settleIds.length,
        settledIds: settleIds,
        totalSettledPaise,
        payoutReference: effectivePayoutReference,
        settlementMethod: effectiveMethod,
        isSimulated,
        settlements: updatedEntries,
      };
    });

    return res.status(200).json({
      success: true,
      message: `Successfully marked ${updatedResult.settledCount} settlement(s) as paid`,
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
