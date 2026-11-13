import { describe, it, expect } from 'vitest';
import { calculateCommission } from '../../config/payment.config.js';

describe('Payment Commission Calculations', () => {
  it('calculates 5% platform commission and 95% doctor allocation correctly for standard ₹1,500 consultation', () => {
    // 1500 INR = 150,000 paise
    const result = calculateCommission(150000, 500);

    expect(result.grossAmountPaise).toBe(150000);
    expect(result.platformFeePaise).toBe(7500); // ₹75.00
    expect(result.doctorSharePaise).toBe(142500); // ₹1,425.00
    expect(result.commissionRateBps).toBe(500);
    expect(result.platformFeePaise + result.doctorSharePaise).toBe(result.grossAmountPaise);
  });

  it('handles arbitrary amounts without floating-point drift', () => {
    // ₹999.00 = 99,900 paise
    // 5% of 99,900 = 4,995 paise
    const result = calculateCommission(99900, 500);

    expect(result.grossAmountPaise).toBe(99900);
    expect(result.platformFeePaise).toBe(4995);
    expect(result.doctorSharePaise).toBe(94905);
    expect(result.platformFeePaise + result.doctorSharePaise).toBe(99900);
  });

  it('handles fractional paise rounding safely via Math.round', () => {
    // 1001 paise at 5% = 50.05 paise -> rounds to 50 paise
    const result = calculateCommission(1001, 500);
    expect(result.platformFeePaise).toBe(50);
    expect(result.doctorSharePaise).toBe(951);
    expect(result.platformFeePaise + result.doctorSharePaise).toBe(1001);
  });

  it('rejects invalid or negative amounts', () => {
    expect(() => calculateCommission(-500)).toThrow();
    expect(() => calculateCommission(123.45)).toThrow();
  });
});
