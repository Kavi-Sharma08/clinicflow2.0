import { type Request, type Response } from 'express';
import { analyzePatientSymptoms } from '../../../services/ai/aiSymptom.service.js';

export const analyzePatientSymptomsController = async (req: Request, res: Response) => {
  try {
    const { symptoms } = req.body;

    if (!symptoms || typeof symptoms !== 'string') {
      return res.status(400).json({
        success: false,
        field: 'symptoms',
        message: 'Symptoms text is required and must be a string',
      });
    }

    const trimmed = symptoms.trim();

    if (trimmed.length < 3) {
      return res.status(400).json({
        success: false,
        field: 'symptoms',
        message: 'Please provide at least 3 characters describing your symptoms',
      });
    }

    if (trimmed.length > 2000) {
      return res.status(400).json({
        success: false,
        field: 'symptoms',
        message: 'Symptoms description cannot exceed 2000 characters',
      });
    }

    const result = await analyzePatientSymptoms(trimmed);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    const message = error?.message || 'Failed to analyze symptoms';
    console.error('[AiSymptomController] Error analyzing symptoms:', message);

    // If microservice connection or timeout failure
    if (
      message.includes('ECONNREFUSED') ||
      message.includes('timed out') ||
      message.includes('fetch failed') ||
      message.includes('ENOTFOUND') ||
      message.includes('AI service responded with HTTP')
    ) {
      return res.status(503).json({
        success: false,
        error: 'AI_SERVICE_UNAVAILABLE',
        message:
          'The AI symptom assistant is temporarily unavailable. Please try again in a moment or proceed directly to Find Doctors.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'An unexpected error occurred while analyzing symptoms. Please try again.',
    });
  }
};
