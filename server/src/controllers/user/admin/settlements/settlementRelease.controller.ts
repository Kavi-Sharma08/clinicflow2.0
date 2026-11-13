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

export const releaseSettlementBatchController = async (req: Request, res: Response) => {
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
      // Find all eligible ledger entries
      const eligibleEntries = await tx.doctorSettlementLedger.findMany({
        where: {
          id: { in: ledgerIds },
          settlementStatus: 'ELIGIBLE',
        },
      });

      if (eligibleEntries.length === 0) {
        throw { status: 400, message: 'No entries in ELIGIBLE status found to settle' };
      }

      const eligibleIds = eligibleEntries.map((e) => e.id);

      // Mark settled
      await tx.doctorSettlementLedger.updateMany({
        where: { id: { in: eligibleIds } },
        data: {
          settlementStatus: 'SETTLED',
          settledAt: new Date(),
          notes: notes?.trim() || 'Settlement released by admin',
        },
      });

      // Write financial audit log
      await tx.financialAuditLog.create({
        data: {
          targetEntity: 'SETTLEMENT',
          targetId: eligibleIds[0]!,
          action: 'RELEASE_SETTLEMENT_BATCH',
          performedById: adminUserId,
          reason: notes?.trim() || null,
          metadata: {
            settledLedgerIds: eligibleIds,
            settledCount: eligibleIds.length,
            totalSettledPaise: eligibleEntries.reduce((sum, e) => sum + e.allocatedAmountPaise, 0),
          },
        },
      });

      return {
        settledCount: eligibleIds.length,
        settledIds: eligibleIds,
      };
    });

    return res.status(200).json({
      success: true,
      message: `Successfully released settlement for ${updatedResult.settledCount} entries`,
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
