import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import http from 'http';
import routes from '../routes/index.js';

describe('Production API Route Registration Verification', () => {
  const app = express();
  app.use(express.json());
  app.use('/api', routes);
  const server = http.createServer(app);

  let baseUrl = '';

  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const addr = server.address();
        if (typeof addr === 'object' && addr !== null) {
          baseUrl = `http://localhost:${addr.port}`;
        }
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it('verifies GET /api/doctor/qr-code is registered (returns 401 when unauthenticated, NOT 404)', async () => {
    const res = await fetch(`${baseUrl}/api/doctor/qr-code`);
    expect(res.status).toBe(401);
    const body = (await res.json()) as { success: boolean; message: string };
    expect(body.message).toMatch(/not authenticated/i);
  });

  it('verifies GET /api/doctor/payouts/summary is registered (returns 401 when unauthenticated, NOT 404)', async () => {
    const res = await fetch(`${baseUrl}/api/doctor/payouts/summary`);
    expect(res.status).toBe(401);
    const body = (await res.json()) as { success: boolean; message: string };
    expect(body.message).toMatch(/not authenticated/i);
  });

  it('verifies GET /api/doctor/payouts/transactions is registered (returns 401 when unauthenticated, NOT 404)', async () => {
    const res = await fetch(`${baseUrl}/api/doctor/payouts/transactions?page=1&limit=10`);
    expect(res.status).toBe(401);
    const body = (await res.json()) as { success: boolean; message: string };
    expect(body.message).toMatch(/not authenticated/i);
  });

  it('verifies POST /api/patient/payments/create-order is registered (returns 401 when unauthenticated, NOT 404)', async () => {
    const res = await fetch(`${baseUrl}/api/patient/payments/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ availabilityId: 'test', appointmentDate: '2026-11-15' }),
    });
    expect(res.status).toBe(401);
    const body = (await res.json()) as { success: boolean; message: string };
    expect(body.message).toMatch(/not authenticated/i);
  });

  it('verifies GET /api/admin/settlements/ledger is registered (returns 401 when unauthenticated, NOT 404)', async () => {
    const res = await fetch(`${baseUrl}/api/admin/settlements/ledger`);
    expect(res.status).toBe(401);
    const body = (await res.json()) as { success: boolean; message: string };
    expect(body.message).toMatch(/not authenticated/i);
  });

  it('verifies POST /api/public/payments/create-order is accessible without auth (validates body, NOT 404)', async () => {
    const res = await fetch(`${baseUrl}/api/public/payments/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    // Public endpoint does not require auth, returns 400 for missing fields (or 429 if rate limited)
    expect(res.status).not.toBe(404);
  });
});
