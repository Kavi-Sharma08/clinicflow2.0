import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import http from 'http';
import routes from '../routes/index.js';
import * as aiSymptomService from '../services/ai/aiSymptom.service.js';
import { prisma } from '../db/db.js';

describe('AI Symptom Assistant Integration Tests', () => {
  const app = express();
  app.use(express.json());
  app.use('/api', routes);
  const server = http.createServer(app);

  let baseUrl = '';

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // 1. Endpoint Registration & Authentication Protection
  describe('Endpoint Registration & Auth Guard', () => {
    it('verifies POST /api/patient/ai/symptom-analysis returns 401 when unauthenticated', async () => {
      const res = await fetch(`${baseUrl || 'http://localhost:3000'}/api/patient/ai/symptom-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptoms: 'persistent headaches and dizziness' }),
      });
      expect(res.status).toBe(401);
      const data = (await res.json()) as { success: boolean; message: string };
      expect(data.success).toBe(false);
      expect(data.message).toMatch(/not authenticated/i);
    });

    it('verifies POST /api/ai/symptom-analysis returns 401 when unauthenticated', async () => {
      const res = await fetch(`${baseUrl || 'http://localhost:3000'}/api/ai/symptom-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptoms: 'knee pain' }),
      });
      expect(res.status).toBe(401);
      const data = (await res.json()) as { success: boolean; message: string };
      expect(data.success).toBe(false);
      expect(data.message).toMatch(/not authenticated/i);
    });
  });

  // 2. Service Layer: Input Validation & Orchestration
  describe('analyzePatientSymptoms Service Unit Tests', () => {
    it('throws validation error if symptoms length is less than 3 chars', async () => {
      await expect(aiSymptomService.analyzePatientSymptoms('hi')).rejects.toThrow(
        /at least 3 characters/i
      );
    });

    it('successfully processes valid symptoms and returns enriched suggestions and matching doctors', async () => {
      // Mock globalThis.fetch for the AI microservice call
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          model_version: '1.0',
          disclaimer: 'Prototype disclaimer',
          abstained: false,
          reason: null,
          urgent: false,
          suggestions: [
            { specialty: 'Cardiology', confidence: 0.884 },
            { specialty: 'Pulmonology', confidence: 0.081 },
          ],
        }),
      } as any);

      // Mock Prisma doctor findMany
      vi.spyOn(prisma.doctorProfile, 'findMany').mockResolvedValueOnce([
        {
          id: 'doc_1',
          userId: 'user_1',
          specializations: ['Cardiology'],
          department: 'Cardiology',
          consultationFee: 500 as any,
          user: {
            id: 'user_1',
            firstName: 'John',
            lastName: 'Smith',
            middleName: null,
            profileImage: null,
          },
        } as any,
      ]);

      const result = await aiSymptomService.analyzePatientSymptoms(
        'I have palpitations and tightness in my chest for the past 2 days'
      );

      expect(result.urgent).toBe(false);
      expect(result.abstained).toBe(false);
      expect(result.primarySpecialty).toBe('Cardiology');
      expect(result.primaryConfidence).toBe(0.88);
      expect(result.suggestions).toHaveLength(2);
      expect(result.suggestions[0]?.conditionCategory).toContain('Cardiovascular');
      expect(result.suggestions[0]?.matchedDoctorsCount).toBe(1);
      expect(result.recommendedDoctors).toHaveLength(1);
      expect(result.recommendedDoctors[0]?.fullName).toBe('John Smith');
      expect(result.clinicalGuidance).toContain('Cardiology');
    });

    it('handles low confidence / abstained model response safely', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          model_version: '1.0',
          disclaimer: 'Prototype disclaimer',
          abstained: true,
          reason: 'Low confidence (top score 0.35 < 0.50 threshold)',
          urgent: false,
          suggestions: [
            { specialty: 'Neurology', confidence: 0.35 },
            { specialty: 'ENT', confidence: 0.22 },
          ],
        }),
      } as any);

      const result = await aiSymptomService.analyzePatientSymptoms('I just feel a bit weird today');

      expect(result.abstained).toBe(true);
      expect(result.reason).toContain('Low confidence');
      expect(result.recommendedDoctors).toEqual([]);
      expect(result.clinicalGuidance).toContain('General Physician');
    });

    it('handles urgent / emergency conditions with high priority warning', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          model_version: '1.0',
          disclaimer: 'Emergency disclaimer',
          abstained: false,
          reason: null,
          urgent: true,
          suggestions: [
            { specialty: 'Emergency Medicine', confidence: 0.95 },
          ],
        }),
      } as any);

      vi.spyOn(prisma.doctorProfile, 'findMany').mockResolvedValueOnce([]);

      const result = await aiSymptomService.analyzePatientSymptoms(
        'Severe crushing central chest pain radiating to left arm with difficulty breathing'
      );

      expect(result.urgent).toBe(true);
      expect(result.primarySpecialty).toBe('Emergency Medicine');
      expect(result.clinicalGuidance).toMatch(/emergency|112|911/i);
    });

    it('handles service timeout or connectivity error gracefully', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementationOnce(() => {
        return Promise.reject(new Error('connect ECONNREFUSED 127.0.0.1:8000'));
      });

      await expect(
        aiSymptomService.analyzePatientSymptoms('knee swelling and sharp pain')
      ).rejects.toThrow(/ECONNREFUSED/);
    });
  });

  // 3. Controller Input Validation Tests
  describe('AiSymptomController HTTP Response Codes', () => {
    it('returns 400 Bad Request when symptoms is missing or non-string', async () => {
      const mockReq: any = { body: {} };
      let statusCode = 0;
      let jsonBody: any = null;
      const mockRes: any = {
        status: (code: number) => {
          statusCode = code;
          return {
            json: (data: any) => {
              jsonBody = data;
            },
          };
        },
      };

      const { analyzePatientSymptomsController } = await import(
        '../controllers/user/patient/aiSymptom.controller.js'
      );

      await analyzePatientSymptomsController(mockReq, mockRes);
      expect(statusCode).toBe(400);
      expect(jsonBody.success).toBe(false);
      expect(jsonBody.field).toBe('symptoms');
    });

    it('returns 400 Bad Request when symptoms exceeds 2000 characters', async () => {
      const mockReq: any = { body: { symptoms: 'a'.repeat(2001) } };
      let statusCode = 0;
      let jsonBody: any = null;
      const mockRes: any = {
        status: (code: number) => {
          statusCode = code;
          return {
            json: (data: any) => {
              jsonBody = data;
            },
          };
        },
      };

      const { analyzePatientSymptomsController } = await import(
        '../controllers/user/patient/aiSymptom.controller.js'
      );

      await analyzePatientSymptomsController(mockReq, mockRes);
      expect(statusCode).toBe(400);
      expect(jsonBody.message).toMatch(/cannot exceed 2000 characters/i);
    });

    it('returns 503 Service Unavailable when microservice connection fails', async () => {
      const mockReq: any = { body: { symptoms: 'headache and dizziness' } };
      let statusCode = 0;
      let jsonBody: any = null;
      const mockRes: any = {
        status: (code: number) => {
          statusCode = code;
          return {
            json: (data: any) => {
              jsonBody = data;
            },
          };
        },
      };

      vi.spyOn(aiSymptomService, 'callAiSpecialtyService').mockRejectedValueOnce(
        new Error('connect ECONNREFUSED 127.0.0.1:8000')
      );

      const { analyzePatientSymptomsController } = await import(
        '../controllers/user/patient/aiSymptom.controller.js'
      );

      await analyzePatientSymptomsController(mockReq, mockRes);
      expect(statusCode).toBe(503);
      expect(jsonBody.error).toBe('AI_SERVICE_UNAVAILABLE');
    });
  });
});
