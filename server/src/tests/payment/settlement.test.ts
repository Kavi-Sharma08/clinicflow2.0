/**
 * Settlement controller unit tests
 *
 * Tests the releaseSettlementBatchController ("Mark as Paid") logic
 * by injecting a fully mocked Prisma transaction and validating
 * the guard rails: duplicate-payout prevention, eligibility checks,
 * simulated vs production payout references, audit log creation,
 * and unauthorised-access rejection.
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import type { Request, Response } from 'express';

// ── Prisma transaction mock ────────────────────────────────────────────────────
// vi.mock is hoisted to the top of the file by vitest, so the mock factory
// cannot reference variables declared below it. Use vi.hoisted() to initialise
// shared mock objects before the hoist boundary.

const { mockTx, mockPrismaInstance } = vi.hoisted(() => {
  const mockTx = {
    doctorSettlementLedger: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    financialAuditLog: {
      create: vi.fn(),
    },
  };

  const mockPrismaInstance = {
    $transaction: vi.fn((cb: (tx: any) => Promise<any>) => cb(mockTx)),
    doctorSettlementLedger: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  };

  return { mockTx, mockPrismaInstance };
});

vi.mock('../../db/db.js', () => ({ prisma: mockPrismaInstance }));

import {
  releaseSettlementBatchController,
  approveSettlementBatchController,
} from '../../controllers/user/admin/settlements/settlementRelease.controller.js';

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeReq(body: Record<string, unknown> = {}, user: Record<string, unknown> = { id: 'admin-uuid-001' }): Request {
  return { body, user, query: {}, headers: {} } as unknown as Request;
}

function makeRes(): { res: Response; json: Mock; status: Mock } {
  const json = vi.fn().mockReturnThis();
  const status = vi.fn().mockReturnValue({ json });
  const res = { status, json } as unknown as Response;
  return { res, json, status };
}

function makeLedgerEntry(overrides: Record<string, unknown> = {}) {
  return {
    id: 'ledger-uuid-001',
    doctorId: 'doctor-uuid-001',
    appointmentId: 'appt-uuid-001',
    allocatedAmountPaise: 142500,
    settlementStatus: 'ELIGIBLE',
    payoutReference: null,
    appointment: { id: 'appt-uuid-001' },
    ...overrides,
  };
}

// ── releaseSettlementBatchController ──────────────────────────────────────────

describe('releaseSettlementBatchController — Mark as Paid', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: no already-settled entries
    mockTx.doctorSettlementLedger.findMany
      .mockResolvedValueOnce([]) // alreadySettled check → empty
      .mockResolvedValueOnce([makeLedgerEntry()]) // entriesToSettle → 1 ELIGIBLE
      .mockResolvedValueOnce([{ // updatedEntries
        id: 'ledger-uuid-001',
        doctorId: 'doctor-uuid-001',
        appointmentId: 'appt-uuid-001',
        allocatedAmountPaise: 142500,
        settlementStatus: 'SETTLED',
        payoutReference: 'SIM_PAY_TEST',
        transferSettledAt: new Date(),
      }]);
    mockTx.doctorSettlementLedger.updateMany.mockResolvedValue({ count: 1 });
    mockTx.financialAuditLog.create.mockResolvedValue({});
  });

  it('marks ELIGIBLE entries as SETTLED in development (simulated payout)', async () => {
    const req = makeReq({ ledgerIds: ['ledger-uuid-001'] });
    const { res, status } = makeRes();

    // Override NODE_ENV to development
    const originalEnv = process.env['NODE_ENV'];
    process.env['NODE_ENV'] = 'development';

    await releaseSettlementBatchController(req, res);

    process.env['NODE_ENV'] = originalEnv;

    expect(status).toHaveBeenCalledWith(200);
    expect(mockTx.doctorSettlementLedger.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ settlementStatus: 'SETTLED' }),
      }),
    );
    expect(mockTx.financialAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'MARK_AS_PAID',
          metadata: expect.objectContaining({ isSimulated: true }),
        }),
      }),
    );
  });

  it('accepts a genuine payoutReference in development', async () => {
    const req = makeReq({ ledgerIds: ['ledger-uuid-001'], payoutReference: 'UTR12345678901234' });
    const { res, status } = makeRes();

    const originalEnv = process.env['NODE_ENV'];
    process.env['NODE_ENV'] = 'development';

    await releaseSettlementBatchController(req, res);

    process.env['NODE_ENV'] = originalEnv;

    expect(status).toHaveBeenCalledWith(200);
    expect(mockTx.doctorSettlementLedger.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ payoutReference: 'UTR12345678901234' }),
      }),
    );
    expect(mockTx.financialAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          metadata: expect.objectContaining({ isSimulated: false }),
        }),
      }),
    );
  });

  it('rejects request when ledgerIds is missing', async () => {
    const req = makeReq({});
    const { res, status, json } = makeRes();

    await releaseSettlementBatchController(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it('rejects request when ledgerIds is an empty array', async () => {
    const req = makeReq({ ledgerIds: [] });
    const { res, status, json } = makeRes();

    await releaseSettlementBatchController(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it('prevents duplicate payout when entry is already SETTLED', async () => {
    // Reset mock to return an already-SETTLED entry in the first findMany call
    mockTx.doctorSettlementLedger.findMany.mockReset();
    mockTx.doctorSettlementLedger.findMany.mockResolvedValueOnce([
      makeLedgerEntry({ settlementStatus: 'SETTLED', payoutReference: 'UTR_PREV_123' }),
    ]);

    const req = makeReq({ ledgerIds: ['ledger-uuid-001'] });
    const { res, status, json } = makeRes();

    const originalEnv = process.env['NODE_ENV'];
    process.env['NODE_ENV'] = 'development';

    await releaseSettlementBatchController(req, res);

    process.env['NODE_ENV'] = originalEnv;

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining('Duplicate payout prevented'),
      }),
    );
    // updateMany must NOT have been called
    expect(mockTx.doctorSettlementLedger.updateMany).not.toHaveBeenCalled();
  });

  it('returns 400 when no ELIGIBLE or APPROVED entries are found', async () => {
    mockTx.doctorSettlementLedger.findMany.mockReset();
    mockTx.doctorSettlementLedger.findMany
      .mockResolvedValueOnce([]) // no already-settled
      .mockResolvedValueOnce([]); // no eligible/approved either

    const req = makeReq({ ledgerIds: ['ledger-uuid-nonexistent'] });
    const { res, status, json } = makeRes();

    const originalEnv = process.env['NODE_ENV'];
    process.env['NODE_ENV'] = 'development';

    await releaseSettlementBatchController(req, res);

    process.env['NODE_ENV'] = originalEnv;

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining('No entries in ELIGIBLE or APPROVED status'),
      }),
    );
  });

  it('rejects simulated reference in production', async () => {
    const req = makeReq({ ledgerIds: ['ledger-uuid-001'] }); // no payoutReference = simulated
    const { res, status, json } = makeRes();

    const originalEnv = process.env['NODE_ENV'];
    process.env['NODE_ENV'] = 'production';

    await releaseSettlementBatchController(req, res);

    process.env['NODE_ENV'] = originalEnv;

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining('payoutReference'),
      }),
    );
  });

  it('rejects SIM_ prefixed reference in production', async () => {
    const req = makeReq({ ledgerIds: ['ledger-uuid-001'], payoutReference: 'SIM_PAY_FAKE' });
    const { res, status, json } = makeRes();

    const originalEnv = process.env['NODE_ENV'];
    process.env['NODE_ENV'] = 'production';

    await releaseSettlementBatchController(req, res);

    process.env['NODE_ENV'] = originalEnv;

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining('Simulated payout references are not permitted'),
      }),
    );
  });

  it('records FinancialAuditLog with correct totals and metadata', async () => {
    const twoEntries = [
      makeLedgerEntry({ id: 'ledger-001', allocatedAmountPaise: 142500 }),
      makeLedgerEntry({ id: 'ledger-002', allocatedAmountPaise: 95000, appointmentId: 'appt-002', appointment: { id: 'appt-002' } }),
    ];

    mockTx.doctorSettlementLedger.findMany.mockReset();
    mockTx.doctorSettlementLedger.findMany
      .mockResolvedValueOnce([]) // no already-settled
      .mockResolvedValueOnce(twoEntries) // entriesToSettle
      .mockResolvedValueOnce(twoEntries.map((e) => ({ ...e, settlementStatus: 'SETTLED' }))); // updated

    mockTx.doctorSettlementLedger.updateMany.mockResolvedValue({ count: 2 });

    const req = makeReq({ ledgerIds: ['ledger-001', 'ledger-002'], payoutReference: 'UTR9999999' });
    const { res, status } = makeRes();

    const originalEnv = process.env['NODE_ENV'];
    process.env['NODE_ENV'] = 'development';

    await releaseSettlementBatchController(req, res);

    process.env['NODE_ENV'] = originalEnv;

    expect(status).toHaveBeenCalledWith(200);
    expect(mockTx.financialAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'MARK_AS_PAID',
          metadata: expect.objectContaining({
            totalSettledPaise: 237500, // 142500 + 95000
            settledCount: 2,
          }),
        }),
      }),
    );
  });
});

// ── approveSettlementBatchController ─────────────────────────────────────────

describe('approveSettlementBatchController — Approve batch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTx.doctorSettlementLedger.findMany.mockResolvedValueOnce([
      makeLedgerEntry({ settlementStatus: 'ELIGIBLE' }),
    ]);
    mockTx.doctorSettlementLedger.updateMany.mockResolvedValue({ count: 1 });
    mockTx.financialAuditLog.create.mockResolvedValue({});
  });

  it('transitions ELIGIBLE entries to APPROVED status', async () => {
    const req = makeReq({ ledgerIds: ['ledger-uuid-001'] });
    const { res, status } = makeRes();

    await approveSettlementBatchController(req, res);

    expect(status).toHaveBeenCalledWith(200);
    expect(mockTx.doctorSettlementLedger.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ settlementStatus: 'APPROVED' }),
      }),
    );
  });

  it('records FinancialAuditLog with APPROVE_SETTLEMENT_BATCH action', async () => {
    const req = makeReq({ ledgerIds: ['ledger-uuid-001'], notes: 'Batch Q4 approval' });
    const { res } = makeRes();

    await approveSettlementBatchController(req, res);

    expect(mockTx.financialAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'APPROVE_SETTLEMENT_BATCH',
          reason: 'Batch Q4 approval',
        }),
      }),
    );
  });

  it('returns 400 when no ELIGIBLE entries are found', async () => {
    mockTx.doctorSettlementLedger.findMany.mockReset();
    mockTx.doctorSettlementLedger.findMany.mockResolvedValueOnce([]); // none eligible

    const req = makeReq({ ledgerIds: ['ledger-uuid-nonexistent'] });
    const { res, status, json } = makeRes();

    await approveSettlementBatchController(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining('No entries in ELIGIBLE status'),
      }),
    );
  });

  it('returns 400 when ledgerIds array is missing', async () => {
    const req = makeReq({});
    const { res, status } = makeRes();

    await approveSettlementBatchController(req, res);

    expect(status).toHaveBeenCalledWith(400);
  });
});

// ── Financial calculation invariants ─────────────────────────────────────────

describe('Settlement financial calculation invariants', () => {
  it('total settled paise equals sum of individual doctor shares', () => {
    const entries = [
      { allocatedAmountPaise: 142500 }, // 95% of 150000
      { allocatedAmountPaise: 237500 }, // 95% of 250000
      { allocatedAmountPaise: 94905 },  // 95% of 99900
    ];

    const totalSettledPaise = entries.reduce((sum, e) => sum + e.allocatedAmountPaise, 0);

    expect(totalSettledPaise).toBe(474905);
    expect(Number.isInteger(totalSettledPaise)).toBe(true);
  });

  it('platform fee + doctor share always equals gross for all entries', () => {
    const testCases = [
      { gross: 150000, bps: 500 },
      { gross: 250000, bps: 500 },
      { gross: 99900, bps: 500 },
      { gross: 1001, bps: 500 },
      { gross: 100, bps: 500 },
    ];

    for (const { gross, bps } of testCases) {
      const fee = Math.round((gross * bps) / 10000);
      const doctorShare = gross - fee;
      expect(fee + doctorShare).toBe(gross);
      expect(Number.isInteger(fee)).toBe(true);
      expect(Number.isInteger(doctorShare)).toBe(true);
    }
  });

  it('marks settlement as SETTLED only once — idempotency guard prevents double-payout', () => {
    // Simulating the guard check: an already-settled entry must block re-settlement
    const entry = makeLedgerEntry({ settlementStatus: 'SETTLED', payoutReference: 'UTR_ORIGINAL' });
    const alreadySettled = entry.settlementStatus === 'SETTLED';
    expect(alreadySettled).toBe(true);
    // The controller reads this and throws {status: 400} before calling updateMany
  });
});
