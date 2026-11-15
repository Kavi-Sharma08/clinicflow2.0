import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  SparkleIcon,
  WarningCircleIcon,
  CheckCircleIcon,
  StethoscopeIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  ArrowClockwiseIcon,
  FirstAidIcon,
  InfoIcon,
} from "@phosphor-icons/react";
import toast from "react-hot-toast";
import { useUser } from "../../../context/UserContext";
import {
  aiSymptomService,
  type SymptomAnalysisResult,
  type MatchedDoctorSummary,
  type EnrichedSpecialtySuggestion,
} from "../../../services/aiSymptomService";

const SAMPLE_PROMPTS = [
  {
    title: "Headache & Dizziness",
    text: "I have been experiencing frequent headaches for the last three days. I also feel dizzy sometimes and have difficulty concentrating.",
  },
  {
    title: "Knee & Joint Pain",
    text: "Severe pain and swelling in my right knee after a morning jog. It hurts especially when climbing stairs or bending.",
  },
  {
    title: "Chest Tightness & Palpitations",
    text: "I feel heart palpitations and mild tightness in my chest when walking uphill, along with occasional lightheadedness.",
  },
  {
    title: "Skin Rash & Itching",
    text: "Red itchy rash with small bumps on my forearms that developed two days ago and worsens with warmth.",
  },
  {
    title: "Cough & Shortness of Breath",
    text: "Dry persistent cough for over a week with occasional wheezing and feeling short of breath at night.",
  },
];

export const AiSymptomAssistant = () => {
  const { user } = useUser();
  const navigate = useNavigate();

  const [symptoms, setSymptoms] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SymptomAnalysisResult | null>(null);

  const handleAnalyze = async (textToAnalyze?: string) => {
    const text = (textToAnalyze ?? symptoms).trim();
    if (!text) {
      toast.error("Please enter a description of your health concerns");
      return;
    }
    if (text.length < 3) {
      toast.error("Please provide at least 3 characters describing your symptoms");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await aiSymptomService.analyzeSymptoms(text);
      if (response.success && response.data) {
        setResult(response.data);
      } else {
        toast.error(response.message || "Could not analyze symptoms. Please try again.");
      }
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        "The AI assistant is temporarily unavailable. Please browse doctors directly.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSample = (sampleText: string) => {
    setSymptoms(sampleText);
    handleAnalyze(sampleText);
  };

  const handleReset = () => {
    setSymptoms("");
    setResult(null);
  };

  const handleBookDoctor = (doc: MatchedDoctorSummary) => {
    if (!user) return;
    const targetSpec = doc.specialization || result?.primarySpecialty || "";
    navigate(`/patient/dashboard/${user.id}/book?doctorId=${doc.doctorId}&specialization=${encodeURIComponent(targetSpec)}`, {
      state: {
        doctorId: doc.doctorId,
        specialization: targetSpec,
        reason: symptoms.slice(0, 150),
      },
    });
  };

  const handleBrowseSpecialty = (specialty: string) => {
    if (!user) return;
    navigate(`/patient/dashboard/${user.id}/book?specialization=${encodeURIComponent(specialty)}`, {
      state: {
        specialization: specialty,
        reason: symptoms.slice(0, 150),
      },
    });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      {/* ─── Hero Header ────────────────────────────────────── */}
      <div className="rounded-2xl border border-sky-100 bg-gradient-to-br from-white via-sky-50/30 to-blue-50/20 p-6 shadow-xs sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/20">
              <SparkleIcon size={26} weight="duotone" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
                  AI Symptom Assistant
                </h1>
                <span className="inline-flex items-center rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-800">
                  Triage Model v1.0
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-600 max-w-2xl leading-relaxed">
                Describe your symptoms in natural language. Our clinical triage model will identify matching medical specialties and help you discover verified clinic doctors.
              </p>
            </div>
          </div>
        </div>

        {/* ─── Mandatory Medical Disclaimer Banner ────────────── */}
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-200/80 bg-amber-50/60 p-4 text-xs text-amber-900">
          <WarningCircleIcon size={20} weight="fill" className="mt-0.5 shrink-0 text-amber-600" />
          <div className="leading-relaxed">
            <span className="font-bold">Medical Disclaimer: </span>
            This AI assistant is an informational triage and routing tool. It does not provide medical diagnoses, prescriptions, or clinical treatment plans. If you are experiencing chest pain, acute shortness of breath, severe bleeding, or any critical emergency, call <strong>112 / 911</strong> or go to an emergency room immediately.
          </div>
        </div>
      </div>

      {/* ─── Symptom Input Section ──────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
        <div className="flex items-center justify-between">
          <label htmlFor="symptoms-input" className="block text-sm font-bold text-slate-900">
            What symptoms are you experiencing?
          </label>
          <span
            className={`text-xs ${
              symptoms.length > 2000 ? "font-bold text-rose-600" : "text-slate-400"
            }`}
          >
            {symptoms.length}/2000 characters
          </span>
        </div>

        <div className="mt-3">
          <textarea
            id="symptoms-input"
            rows={4}
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="E.g., I've had a persistent dull headache and dizziness for the last 3 days, especially when standing up or reading..."
            className="w-full resize-y rounded-xl border border-slate-200 p-3.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          />
        </div>

        {/* Example prompts */}
        <div className="mt-4">
          <p className="text-xs font-semibold text-slate-500">Quick test examples:</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {SAMPLE_PROMPTS.map((sample) => (
              <button
                key={sample.title}
                type="button"
                onClick={() => handleSelectSample(sample.text)}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-sky-300 hover:bg-sky-50/50 hover:text-sky-700 disabled:opacity-50"
              >
                <SparkleIcon size={13} className="text-sky-600" />
                {sample.title}
              </button>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
          <button
            type="button"
            onClick={handleReset}
            disabled={loading || (!symptoms && !result)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 disabled:opacity-40"
          >
            <ArrowClockwiseIcon size={14} />
            Clear
          </button>

          <button
            type="button"
            onClick={() => handleAnalyze()}
            disabled={loading || symptoms.trim().length < 3 || symptoms.length > 2000}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-sky-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Analyzing symptoms...</span>
              </>
            ) : (
              <>
                <SparkleIcon size={17} weight="bold" />
                <span>Analyze Symptoms</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ─── Loading Placeholder ────────────────────────────── */}
      {loading && (
        <div className="rounded-2xl border border-sky-100 bg-white p-8 text-center shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 animate-pulse">
            <SparkleIcon size={32} weight="duotone" />
          </div>
          <h3 className="mt-4 text-base font-bold text-slate-900">
            Evaluating Health Concerns
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
            Passing symptom text to the specialty model and querying available ClinicFlow verified specialists...
          </p>
        </div>
      )}

      {/* ─── Results Presentation ───────────────────────────── */}
      {result && !loading && (
        <div className="space-y-6">
          {/* Urgent Warning if applicable */}
          {result.urgent && (
            <div className="rounded-2xl border border-rose-300 bg-rose-50/80 p-5 shadow-xs">
              <div className="flex items-start gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white shadow-sm">
                  <FirstAidIcon size={22} weight="bold" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-rose-900">
                    URGENT MEDICAL ATTENTION RECOMMENDED
                  </h3>
                  <p className="mt-1 text-xs font-medium text-rose-800 leading-relaxed">
                    {result.clinicalGuidance}
                  </p>
                  <p className="mt-2 text-xs font-semibold text-rose-900">
                    Emergency Hotline: Call 112 / 911 or head directly to the nearest hospital triage center.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Abstention / Low-confidence Notice if applicable */}
          {result.abstained && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 shadow-xs">
              <div className="flex items-start gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white">
                  <InfoIcon size={22} weight="bold" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-amber-900">
                    General or Low-Confidence Pattern Detected
                  </h3>
                  <p className="mt-1 text-xs text-amber-800 leading-relaxed">
                    {result.clinicalGuidance}
                  </p>
                  {result.reason && (
                    <p className="mt-1.5 text-[11px] font-mono text-amber-700">
                      Reason: {result.reason}
                    </p>
                  )}
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => navigate(`/patient/dashboard/${user?.id}/book`)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-amber-700"
                    >
                      <StethoscopeIcon size={14} />
                      Browse All Doctors & Specialties
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Primary Recommendation Card */}
          {result.primarySpecialty && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-sky-600">
                    Recommended Specialty
                  </span>
                  <h2 className="mt-1 text-2xl font-black text-slate-900">
                    {result.primarySpecialty}
                  </h2>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed max-w-2xl">
                    {result.clinicalGuidance}
                  </p>
                </div>

                {result.primaryConfidence !== null && (
                  <div className="flex shrink-0 items-center gap-2 rounded-xl bg-sky-50 px-3.5 py-2 border border-sky-100">
                    <CheckCircleIcon size={18} weight="fill" className="text-sky-600" />
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Confidence
                      </div>
                      <div className="text-sm font-black text-sky-800">
                        {Math.round(result.primaryConfidence * 100)}%
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Suggestions Breakdown */}
              {result.suggestions.length > 0 && (
                <div className="mt-6 border-t border-slate-100 pt-5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Specialty Breakdown & Focus Areas
                  </h4>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {result.suggestions.map((sug: EnrichedSpecialtySuggestion, idx: number) => (
                      <div
                        key={sug.specialty}
                        className={`rounded-xl border p-4 transition ${
                          idx === 0
                            ? "border-sky-300 bg-sky-50/40"
                            : "border-slate-100 bg-slate-50/60"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-bold text-slate-900">
                            {sug.specialty}
                          </span>
                          <span className="rounded-md bg-white px-2 py-0.5 text-xs font-bold text-slate-700 shadow-2xs border border-slate-200">
                            {Math.round(sug.confidence * 100)}%
                          </span>
                        </div>
                        <p className="mt-1 text-xs font-medium text-slate-600">
                          {sug.conditionCategory}
                        </p>
                        <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                          {sug.description}
                        </p>
                        <div className="mt-3 flex items-center justify-between border-t border-slate-200/60 pt-2">
                          <span className="text-[11px] text-slate-500 font-medium">
                            {sug.matchedDoctorsCount} verified doctor{sug.matchedDoctorsCount === 1 ? "" : "s"}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleBrowseSpecialty(sug.specialty)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-sky-700 hover:text-sky-900"
                          >
                            <span>Filter doctors</span>
                            <ArrowRightIcon size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── Matching Doctors Discovery ──────────────────────── */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-7">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Recommended ClinicFlow Specialists
                </h3>
                <p className="text-xs text-slate-500">
                  Select a verified doctor to view available slots and schedule your visit.
                </p>
              </div>

              {result.primarySpecialty && (
                <button
                  type="button"
                  onClick={() => handleBrowseSpecialty(result.primarySpecialty!)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-800"
                >
                  <span>View all in {result.primarySpecialty}</span>
                  <ArrowRightIcon size={13} />
                </button>
              )}
            </div>

            {result.recommendedDoctors.length === 0 ? (
              <div className="py-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                  <StethoscopeIcon size={24} />
                </div>
                <h4 className="mt-3 text-sm font-bold text-slate-800">
                  No direct specialists found in this department
                </h4>
                <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
                  You can consult our General Practitioners or contact the clinic reception to schedule a referral.
                </p>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => navigate(`/patient/dashboard/${user?.id}/book`)}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
                  >
                    <span>Browse All Available Doctors</span>
                    <ArrowRightIcon size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {result.recommendedDoctors.map((doc: MatchedDoctorSummary) => (
                  <div
                    key={doc.doctorId}
                    className="flex flex-col justify-between rounded-xl border border-slate-200 p-4 transition hover:border-sky-300 hover:shadow-xs"
                  >
                    <div>
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-sky-50 text-sky-700 font-bold border border-sky-100">
                          {doc.profilePhotoUrl ? (
                            <img
                              src={doc.profilePhotoUrl}
                              alt={doc.fullName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <StethoscopeIcon size={22} weight="duotone" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="truncate text-sm font-bold text-slate-900">
                            Dr. {doc.fullName}
                          </h4>
                          <p className="text-xs font-medium text-slate-500 truncate">
                            {doc.specialization ?? doc.department}
                          </p>
                          <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-700">
                            <ShieldCheckIcon size={13} weight="fill" />
                            <span>Verified Specialist</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs text-slate-600 border-t border-slate-100 pt-2.5">
                        <span className="font-semibold text-slate-900">
                          ₹{doc.consultationFee}{" "}
                          <span className="text-[10px] font-normal text-slate-400">/ visit</span>
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {doc.department}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleBookDoctor(doc)}
                      className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-sky-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-sky-700 active:scale-[0.99]"
                    >
                      <span>Book Consultation</span>
                      <ArrowRightIcon size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AiSymptomAssistant;
