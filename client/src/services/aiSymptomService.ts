import api from '../lib/axios';

export interface EnrichedSpecialtySuggestion {
  specialty: string;
  confidence: number;
  conditionCategory: string;
  description: string;
  matchedDoctorsCount: number;
}

export interface MatchedDoctorSummary {
  doctorId: string;
  userId: string;
  fullName: string;
  specialization: string | null;
  specializations: string[];
  department: string;
  consultationFee: number;
  profilePhotoUrl: string | null;
}

export interface SymptomAnalysisResult {
  urgent: boolean;
  abstained: boolean;
  reason: string | null;
  disclaimer: string;
  primarySpecialty: string | null;
  primaryConfidence: number | null;
  suggestions: EnrichedSpecialtySuggestion[];
  recommendedDoctors: MatchedDoctorSummary[];
  clinicalGuidance: string;
}

export interface SymptomAnalysisResponse {
  success: boolean;
  data: SymptomAnalysisResult;
  message?: string;
  error?: string;
}

export const aiSymptomService = {
  analyzeSymptoms: async (symptoms: string): Promise<SymptomAnalysisResponse> => {
    const response = await api.post<SymptomAnalysisResponse>('/patient/ai/symptom-analysis', {
      symptoms,
    });
    return response.data;
  },
};

export default aiSymptomService;
