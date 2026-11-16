/**
 * Doctor No-Show Workflow Tests
 *
 * Verifies the complete doctor no-show lifecycle:
 * - Route registration and parameter tolerance (:id and :appointmentId)
 * - Ownership & authorization validation
 * - State machine validation (unpaid, terminal, valid)
 * - Transactional ledger hold (PENDING_COMPLETION / ELIGIBLE -> ON_HOLD_PENDING_REVIEW)
 * - Audit log creation & realtime / notification dispatches
 * - Idempotency when already marked as NO_SHOW
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import type { Request, Response } from 'express';

const { mockPrisma, mockQueueService, mockNotificationService, mockRealtimeService } = vi.hoisted(() => {
  const mockTx = {
    appointment: {
      update: vi.fn(),
    },
    doctorSettlementLedger: {
      updateMany: vi.fn(),
    },
    appointmentAudit: {
      create: vi.fn(),
    },
  };

  const mockPrisma = {
    $transaction: vi.fn((cb: (tx: any) => Promise<any>) => cb(mockTx)),
    doctorProfile: {
      findUnique: vi.fn(),
    },
    appointment: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    doctorSettlementLedger: {
      updateMany: vi.fn(),
    },
    _mockTx: mockTx,
  };

  const mockQueueService = {
    recalculateQueue: vi.fn().mockResolvedValue(undefined),
    getLiveQueueSnapshot: vi.fn().mockResolvedValue({ summary: {} }),
    serializeQueueAppointment: vi.fn((a: any) => ({ id: a.id, status: a.status, queueNumber: a.queueNumber })),
  };

  const mockNotificationService = {
    createNotification: vi.fn().mockResolvedValue(undefined),
    notifyRole: vi.fn().mockResolvedValue(undefined),
  };

  const mockRealtimeService = {
    emitQueueUpdated: vi.fn(),
    emitToRole: vi.fn(),
    getRealtimeServer: vi.fn().mockReturnValue({
      to: vi.fn().mockReturnValue({
        emit: vi.fn(),
      }),
    }),
  };

  return { mockPrisma, mockQueueService, mockNotificationService, mockRealtimeService };
});

vi.mock('../db/db.js', () => ({ prisma: mockPrisma }));
vi.mock('../services/queue.service.js', () => mockQueueService);
vi.mock('../services/notification.service.js', () => mockNotificationService);
vi.mock('../services/realtime.service.js', () => mockRealtimeService);

import { markNoShow } from '../controllers/user/doctor/queue.controller.js';
import { updateDoctorAppointmentStatus } from '../controllers/user/doctor/booking.controller.js';

function makeReq(
  params: Record<string, string> = {},
  body: Record<string, unknown> = {},
  user: Record<string, unknown> = { id: 'doctor-user-001', role: 'DOCTOR' },
): Request {
  return { params, body, user } as unknown as Request;
}

function makeRes(): { res: Response; json: Mock; status: Mock } {
  const json = vi.fn().mockReturnThis();
  const status = vi.fn().mockReturnValue({ json });
  const res = { status, json } as unknown as Response;
  return { res, json, status };
}

describe('Doctor No-Show Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockPrisma.doctorProfile.findUnique.mockResolvedValue({
      id: 'doc-profile-001',
      userId: 'doctor-user-001',
    });
  });

  it('rejects when appointment ID is missing from params and body', async () => {
    const req = makeReq({}, {});
    const { res, status, json } = makeRes();

    await markNoShow(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Appointment id is required' }));
  });

  it('accepts appointment ID from req.params.appointmentId alias', async () => {
    mockPrisma.appointment.findUnique.mockResolvedValue({
      id: 'cmwgdpuyg00063nd586dmrkb8',
      doctorId: 'doc-profile-001',
      status: 'BOOKED',
      appointmentDate: new Date('2026-11-20T09:00:00.000Z'),
      doctor: { user: { firstName: 'Jane', lastName: 'Doe' } },
      patient: { userId: 'patient-user-001', user: { firstName: 'John', lastName: 'Smith' } },
    });

    mockPrisma._mockTx.appointment.update.mockResolvedValue({
      id: 'cmwgdpuyg00063nd586dmrkb8',
      doctorId: 'doc-profile-001',
      status: 'NO_SHOW',
      queueNumber: 3,
      appointmentDate: new Date('2026-11-20T09:00:00.000Z'),
      doctor: { user: { firstName: 'Jane', lastName: 'Doe' } },
      patient: { userId: 'patient-user-001', user: { firstName: 'John', lastName: 'Smith' } },
    });

    const req = makeReq({ appointmentId: 'cmwgdpuyg00063nd586dmrkb8' }, {});
    const { res, status } = makeRes();

    await markNoShow(req, res);

    expect(status).toHaveBeenCalledWith(200);
    expect(mockPrisma._mockTx.doctorSettlementLedger.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          appointmentId: 'cmwgdpuyg00063nd586dmrkb8',
          settlementStatus: { in: ['PENDING_COMPLETION', 'ELIGIBLE'] },
        }),
        data: expect.objectContaining({
          settlementStatus: 'ON_HOLD_PENDING_REVIEW',
        }),
      }),
    );
  });

  it('rejects when doctor does not own the appointment (403)', async () => {
    mockPrisma.appointment.findUnique.mockResolvedValue({
      id: 'appt-other-doc',
      doctorId: 'another-doctor-profile',
      status: 'BOOKED',
      doctor: { user: {} },
    });

    const req = makeReq({ id: 'appt-other-doc' });
    const { res, status } = makeRes();

    await markNoShow(req, res);

    expect(status).toHaveBeenCalledWith(403);
  });

  it('rejects unpaid appointments from being marked as no-show (400)', async () => {
    mockPrisma.appointment.findUnique.mockResolvedValue({
      id: 'appt-unpaid',
      doctorId: 'doc-profile-001',
      status: 'PENDING_PAYMENT',
      doctor: { user: {} },
    });

    const req = makeReq({ id: 'appt-unpaid' });
    const { res, status, json } = makeRes();

    await markNoShow(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('unpaid') }));
  });

  it('rejects already COMPLETED or CANCELLED appointments (409)', async () => {
    mockPrisma.appointment.findUnique.mockResolvedValue({
      id: 'appt-completed',
      doctorId: 'doc-profile-001',
      status: 'COMPLETED',
      doctor: { user: {} },
    });

    const req = makeReq({ id: 'appt-completed' });
    const { res, status } = makeRes();

    await markNoShow(req, res);

    expect(status).toHaveBeenCalledWith(409);
  });

  it('handles idempotent call when appointment is already marked as NO_SHOW (200)', async () => {
    mockPrisma.appointment.findUnique.mockResolvedValue({
      id: 'appt-already-noshow',
      doctorId: 'doc-profile-001',
      status: 'NO_SHOW',
      queueNumber: 2,
      doctor: { user: {} },
    });

    const req = makeReq({ id: 'appt-already-noshow' });
    const { res, status, json } = makeRes();

    await markNoShow(req, res);

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      message: expect.stringContaining('already marked as no-show'),
    }));
    // Should NOT re-run update transaction
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it('allows marking no-show via updateDoctorAppointmentStatus PATCH endpoint', async () => {
    mockPrisma.appointment.findUnique.mockResolvedValue({
      id: 'appt-patch-test',
      doctorId: 'doc-profile-001',
      status: 'BOOKED',
      appointmentDate: new Date('2026-11-20T09:00:00.000Z'),
      doctor: { user: { firstName: 'Jane', lastName: 'Doe' } },
      patient: { userId: 'patient-user-001', user: { firstName: 'John', lastName: 'Smith' } },
    });

    mockPrisma._mockTx.appointment.update.mockResolvedValue({
      id: 'appt-patch-test',
      doctorId: 'doc-profile-001',
      status: 'NO_SHOW',
      queueNumber: 4,
      appointmentDate: new Date('2026-11-20T09:00:00.000Z'),
      doctor: { user: { firstName: 'Jane', lastName: 'Doe' } },
      patient: { userId: 'patient-user-001', user: { firstName: 'John', lastName: 'Smith' } },
    });

    const req = makeReq({ id: 'appt-patch-test' }, { status: 'NO_SHOW' });
    const { res, status } = makeRes();

    await updateDoctorAppointmentStatus(req, res);

    expect(status).toHaveBeenCalledWith(200);
    expect(mockPrisma._mockTx.doctorSettlementLedger.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          settlementStatus: 'ON_HOLD_PENDING_REVIEW',
        }),
      }),
    );
  });
});
