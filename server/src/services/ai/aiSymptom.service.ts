import { env } from '../../config/env.js';
import { prisma } from '../../db/db.js';
import { getUserDisplayName } from '../../utils/userDisplay.js';

export interface RawAiModelSuggestion {
  specialty: string;
  confidence: number;
}

export interface RawAiServiceResponse {
  model_version: string;
  disclaimer: string;
  abstained: boolean;
  reason: string | null;
  urgent: boolean;
  suggestions: RawAiModelSuggestion[];
}

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

export const SPECIALTY_METADATA: Record<
  string,
  { category: string; description: string; aliases: string[] }
> = {
  Cardiology: {
    category: 'Cardiovascular & Heart Health',
    description: 'Heart, blood vessels, circulation, palpitations, chest pressure, and hypertension.',
    aliases: ['Cardiology', 'Cardiologist', 'Cardiovascular Medicine', 'Heart Care'],
  },
  Dermatology: {
    category: 'Dermatology & Skin Disorders',
    description: 'Skin, hair, nails, unexplained rashes, itching, dermal lesions, or allergic eczema.',
    aliases: ['Dermatology', 'Dermatologist', 'Skin Specialist'],
  },
  ENT: {
    category: 'Ear, Nose & Throat (Otolaryngology)',
    description: 'Ear infections, nasal congestion, sinuses, hearing issues, throat soreness, or balance concerns.',
    aliases: ['ENT', 'Otolaryngology', 'Ear Nose Throat', 'Otolaryngologist'],
  },
  'Emergency Medicine': {
    category: 'Emergency & Critical Triage',
    description: 'Severe, acute, or potentially life-threatening symptoms requiring immediate medical evaluation.',
    aliases: ['Emergency Medicine', 'Urgent Care', 'Emergency', 'Casualty'],
  },
  Endocrinology: {
    category: 'Endocrine & Metabolic Health',
    description: 'Hormone regulation, thyroid disorders, diabetes management, fatigue, and metabolic conditions.',
    aliases: ['Endocrinology', 'Endocrinologist', 'Diabetes & Metabolism', 'Metabolic Health'],
  },
  Gastroenterology: {
    category: 'Digestive & Gastrointestinal Health',
    description: 'Digestive tract, stomach pain, acid reflux, liver, intestinal discomfort, and bowel irregularities.',
    aliases: ['Gastroenterology', 'Gastroenterologist', 'Digestive Diseases', 'GI Specialist'],
  },
  'Mental Health': {
    category: 'Mental Health & Behavioral Care',
    description: 'Emotional well-being, mood disorders, persistent anxiety, depression, insomnia, and stress.',
    aliases: ['Mental Health', 'Psychiatry', 'Psychology', 'Behavioral Health', 'Psychiatrist'],
  },
  Neurology: {
    category: 'Neurological & Brain Health',
    description: 'Nervous system, severe headaches/migraines, tremors, dizziness, numbness, and cognitive symptoms.',
    aliases: ['Neurology', 'Neurologist', 'Neuro Medicine'],
  },
  Oncology: {
    category: 'Oncology & Tumor Evaluation',
    description: 'Abnormal masses, oncological screenings, unexplained persistent weight loss, and cancer care.',
    aliases: ['Oncology', 'Oncologist', 'Cancer Specialist', 'Surgical Oncology'],
  },
  Ophthalmology: {
    category: 'Ophthalmology & Vision Care',
    description: 'Vision changes, eye pain, blurriness, ocular inflammation, and eye strain.',
    aliases: ['Ophthalmology', 'Ophthalmologist', 'Eye Specialist', 'Optometry'],
  },
  Orthopedics: {
    category: 'Musculoskeletal & Orthopedic Care',
    description: 'Bones, joints, muscles, ligaments, chronic back/knee pain, sports injuries, and arthritis.',
    aliases: ['Orthopedics', 'Orthopedic Surgery', 'Orthopedist', 'Bone & Joint'],
  },
  Pulmonology: {
    category: 'Respiratory & Lung Health',
    description: 'Lungs, breathing difficulties, chronic cough, asthma, shortness of breath, and chest congestion.',
    aliases: ['Pulmonology', 'Pulmonologist', 'Respiratory Medicine', 'Chest Physician'],
  },
  Rheumatology: {
    category: 'Autoimmune & Rheumatologic Diseases',
    description: 'Systemic inflammation, autoimmune disorders, rheumatoid arthritis, joint stiffness, and lupus.',
    aliases: ['Rheumatology', 'Rheumatologist', 'Autoimmune Care'],
  },
  Urology: {
    category: 'Urological & Renal Health',
    description: 'Urinary tract, bladder health, kidney stones, pelvic discomfort, and urogenital concerns.',
    aliases: ['Urology', 'Urologist', 'Genitourinary Medicine'],
  },
};

const DEFAULT_DISCLAIMER =
  'Automated suggestion from an AI clinical triage model. It is not a diagnosis and not medical advice. Always consult a licensed healthcare professional. In case of medical emergencies, call 112 / 911 immediately.';

/**
 * Call the Python AI FastAPI microservice for symptom classification.
 */
export async function callAiSpecialtyService(text: string): Promise<RawAiServiceResponse> {
  const serviceUrl = `${env.AI_SERVICE.URL}/predict`;
  const timeoutMs = env.AI_SERVICE.TIMEOUT_MS || 5000;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (env.AI_SERVICE.API_KEY) {
    headers['x-api-key'] = env.AI_SERVICE.API_KEY;
  }

  try {
    const response = await fetch(serviceUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ text }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`AI service responded with HTTP ${response.status}: ${errText || response.statusText}`);
    }

    const data = (await response.json()) as RawAiServiceResponse;
    return data;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error(`AI service request timed out after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Find verified doctors matching the given specialties and their alias variants.
 */
export async function findMatchingDoctorsForSpecialties(
  specialties: string[],
  limit = 6
): Promise<MatchedDoctorSummary[]> {
  if (!specialties || specialties.length === 0) return [];

  // Build full list of search terms from metadata aliases
  const searchTerms = new Set<string>();
  for (const s of specialties) {
    searchTerms.add(s);
    const meta = SPECIALTY_METADATA[s];
    if (meta) {
      for (const alias of meta.aliases) {
        searchTerms.add(alias);
      }
    }
  }

  const termsArray = Array.from(searchTerms);

  // Query verified doctors from Prisma whose specializations match
  const doctors = await prisma.doctorProfile.findMany({
    where: {
      verificationStatus: 'VERIFIED',
      OR: [
        { specializations: { hasSome: termsArray } },
        { department: { in: termsArray, mode: 'insensitive' } },
      ],
    },
    include: {
      user: true,
    },
    take: limit,
  });

  return doctors.map((doc) => ({
    doctorId: doc.id,
    userId: doc.user.id,
    fullName: getUserDisplayName(doc.user),
    specialization: doc.specializations[0] ?? doc.department ?? null,
    specializations: doc.specializations,
    department: doc.department,
    consultationFee: Number(doc.consultationFee),
    profilePhotoUrl: doc.user.profileImage,
  }));
}

/**
 * Complete orchestrator for patient symptom analysis:
 * 1. Calls Python AI specialty microservice.
 * 2. Parses model predictions and checks abstention / urgency.
 * 3. Enriches suggestions with clinical descriptions and matched doctor counts.
 * 4. Queries verified ClinicFlow doctors for recommended booking.
 * 5. Generates human-understandable guidance and medical disclaimers.
 */
export async function analyzePatientSymptoms(symptoms: string): Promise<SymptomAnalysisResult> {
  const cleanSymptoms = symptoms.trim();
  if (cleanSymptoms.length < 3) {
    throw new Error('Symptoms description is too short. Please provide at least 3 characters.');
  }

  // 1. Call AI microservice
  const aiResult = await callAiSpecialtyService(cleanSymptoms);

  const rawSuggestions = Array.isArray(aiResult.suggestions) ? aiResult.suggestions : [];
  const primary = rawSuggestions[0] ?? null;

  // 2. Fetch doctors for top specialties if not abstained
  const topSpecialtyNames = rawSuggestions.slice(0, 3).map((s) => s.specialty);
  const matchingDoctors = !aiResult.abstained
    ? await findMatchingDoctorsForSpecialties(topSpecialtyNames, 6)
    : [];

  // 3. Enrich suggestions
  const enrichedSuggestions: EnrichedSpecialtySuggestion[] = rawSuggestions.map((s) => {
    const meta = SPECIALTY_METADATA[s.specialty] || {
      category: `${s.specialty} Care`,
      description: `Medical care related to ${s.specialty}.`,
      aliases: [s.specialty],
    };

    // Count how many matching doctors we have for this specific specialty
    const count = matchingDoctors.filter(
      (d) =>
        d.specializations.includes(s.specialty) ||
        meta.aliases.some((alias) => d.specializations.includes(alias)) ||
        d.department.toLowerCase() === s.specialty.toLowerCase()
    ).length;

    return {
      specialty: s.specialty,
      confidence: Math.round(s.confidence * 100) / 100,
      conditionCategory: meta.category,
      description: meta.description,
      matchedDoctorsCount: count,
    };
  });

  // 4. Clinical guidance text
  let clinicalGuidance = '';
  if (aiResult.urgent) {
    clinicalGuidance =
      'Your described symptoms indicate acute, critical, or urgent medical factors. Please proceed directly to an emergency department or call emergency services (112 / 911) immediately.';
  } else if (aiResult.abstained) {
    clinicalGuidance =
      'The symptom pattern provided is too general or non-specific to pinpoint a specialized medical department with high confidence. We recommend consulting a General Physician for an initial comprehensive check-up.';
  } else if (primary) {
    clinicalGuidance = `Based on your reported symptoms, an evaluation by a specialist in ${primary.specialty} is suggested. You may review matching clinic doctors below and choose an appointment slot.`;
  } else {
    clinicalGuidance =
      'Please consult a certified physician for further examination.';
  }

  return {
    urgent: Boolean(aiResult.urgent),
    abstained: Boolean(aiResult.abstained),
    reason: aiResult.reason,
    disclaimer: aiResult.disclaimer || DEFAULT_DISCLAIMER,
    primarySpecialty: primary ? primary.specialty : null,
    primaryConfidence: primary ? Math.round(primary.confidence * 100) / 100 : null,
    suggestions: enrichedSuggestions,
    recommendedDoctors: matchingDoctors,
    clinicalGuidance,
  };
}
