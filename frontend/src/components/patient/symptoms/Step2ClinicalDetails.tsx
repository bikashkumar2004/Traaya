"use client";

import React from "react";
import {
  Stethoscope,
  Check,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  X,
  AlertTriangle,
  FileText,
} from "lucide-react";

export interface FollowUpQuestion {
  id: string;
  question: string;
  type: "number" | "radio" | "text";
  options?: string[];
  placeholder?: string;
  unit?: string;
}

export interface TimelineItem {
  date: string;
  event: string;
}

export interface Step2ClinicalDetailsProps {
  aiSource: string;
  followUpQuestions: FollowUpQuestion[];
  currentQuestionIndex: number;
  setCurrentQuestionIndex: (idx: number) => void;
  followUpAnswers: Record<string, string>;
  setFollowUpAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  extractedSymptoms: string[];
  setExtractedSymptoms: React.Dispatch<React.SetStateAction<string[]>>;
  timeline: TimelineItem[];
  missingItems: string[];
  onBack: () => void;
  onContinue: () => void;
  onSaveDraft: () => void;
  isSavingDraft: boolean;
  isSubmitting: boolean;
}

export function Step2ClinicalDetails({
  aiSource,
  followUpQuestions,
  currentQuestionIndex,
  setCurrentQuestionIndex,
  followUpAnswers,
  setFollowUpAnswers,
  extractedSymptoms,
  setExtractedSymptoms,
  timeline,
  missingItems,
  onBack,
  onContinue,
  onSaveDraft,
  isSavingDraft,
  isSubmitting,
}: Step2ClinicalDetailsProps) {
  const currentQ = followUpQuestions[currentQuestionIndex];

  // Helper to verify if a question has been validly answered
  const isQuestionAnswered = (q?: FollowUpQuestion): boolean => {
    if (!q) return false;
    const ans = (followUpAnswers[q.id] || "").trim();
    if (!ans) return false;
    // If it's an "Other" option, check that user actually typed custom details
    if (ans === "Other" || ans === "Other:" || ans === "Other (Please specify)" || ans === "Other: ") {
      return false;
    }
    if (ans.startsWith("Other:") && !ans.replace(/^Other:\s*/, "").trim()) {
      return false;
    }
    return true;
  };

  const isCurrentAnswered = isQuestionAnswered(currentQ);
  const allQuestionsAnswered = followUpQuestions.every((q) => isQuestionAnswered(q));

  // Determine if the current question's selected answer is "Other"
  const currentAnsVal = (followUpAnswers[currentQ?.id] || "").trim();
  const isOtherSelected =
    Boolean(currentQ) &&
    (currentAnsVal === "Other" ||
      currentAnsVal === "Other (Please specify)" ||
      currentAnsVal.startsWith("Other:"));
  const otherCustomText = isOtherSelected ? currentAnsVal.replace(/^Other:\s*/, "") : "";

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-6 text-slate-900">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
            Help us understand your symptoms better
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Our AI clinical assistant asks follow-up questions one by one like a doctor to collect complete clinical details.
          </p>
        </div>
      </div>

      {/* 2-Column Responsive Layout in expanded width */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT: 1-by-1 Doctor Consultation (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Doctor Consultation Banner */}
          <div className="flex items-center justify-between bg-gradient-to-r from-teal-900 via-teal-800 to-teal-900 text-white rounded-2xl p-4 sm:p-5 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-teal-200 shrink-0">
                <Stethoscope className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  Question {followUpQuestions.length > 0 ? currentQuestionIndex + 1 : 0} of {followUpQuestions.length}
                </h3>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-teal-200 font-medium block">Progress</span>
              <span className="text-xs sm:text-sm font-black text-white">
                {followUpQuestions.length > 0
                  ? Math.round(
                      ((currentQuestionIndex + 1) / followUpQuestions.length) * 100
                    )
                  : 100}
                %
              </span>
            </div>
          </div>

          {/* Question Stepper Indicator Pills */}
          {followUpQuestions.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {followUpQuestions.map((q, qIdx) => {
                const isAnswered = isQuestionAnswered(q);
                const isCurrent = currentQuestionIndex === qIdx;
                // Can only advance forward if all preceding questions are answered
                const canAdvance = followUpQuestions.slice(0, qIdx).every((pq) => isQuestionAnswered(pq));

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => {
                      if (canAdvance || qIdx <= currentQuestionIndex) {
                        setCurrentQuestionIndex(qIdx);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                      isCurrent
                        ? "bg-teal-800 text-white shadow-xs ring-2 ring-teal-600/30 cursor-pointer"
                        : isAnswered
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 cursor-pointer"
                        : canAdvance
                        ? "bg-slate-100 text-slate-500 hover:bg-slate-200 cursor-pointer"
                        : "bg-slate-100/60 text-slate-400 cursor-not-allowed opacity-60"
                    }`}
                  >
                    {isAnswered && !isCurrent ? (
                      <Check className="w-3 h-3 text-emerald-700" />
                    ) : (
                      <span>{qIdx + 1}.</span>
                    )}
                    <span>Question {qIdx + 1}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Active Doctor Question Card (1 by 1) */}
          {followUpQuestions.length > 0 && currentQ && (
            <div className="p-6 sm:p-7 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-5">
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-teal-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  <span>Clinical Inquiry #{currentQuestionIndex + 1}</span>
                </div>
                <h4 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                  {currentQ.question}
                </h4>
                <p className="text-xs text-slate-500">
                  Please choose the best answer or type your own.
                </p>
              </div>

              {/* Number Input (e.g. Temperature, Blood Pressure) */}
              {currentQ.type === "number" && (
                <div className="space-y-3 pt-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.1"
                      value={followUpAnswers[currentQ.id] || ""}
                      onChange={(e) =>
                        setFollowUpAnswers({
                          ...followUpAnswers,
                          [currentQ.id]: e.target.value
                        })
                      }
                      placeholder={currentQ.placeholder || "Enter number..."}
                      className="w-36 p-3 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold text-center text-sm focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 shadow-2xs"
                    />
                    {currentQ.unit && (
                      <span className="text-slate-700 font-bold text-sm">{currentQ.unit}</span>
                    )}
                  </div>

                  {currentQ.id.includes("temp") && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] text-slate-500 font-semibold block">
                        Quick temperatures:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {["98.6", "100.4", "101.5", "102.8", "104.0"].map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() =>
                              setFollowUpAnswers({ ...followUpAnswers, [currentQ.id]: t })
                            }
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                              followUpAnswers[currentQ.id] === t
                                ? "bg-teal-800 text-white shadow-xs"
                                : "bg-white hover:bg-teal-50 text-slate-700 border border-slate-200"
                            }`}
                          >
                            {t}°F {parseFloat(t) >= 102 ? "(High fever)" : parseFloat(t) >= 100 ? "(Fever)" : "(Normal)"}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Radio Options with "Other" Choice & Custom Input */}
              {currentQ.type === "radio" && currentQ.options && (
                <div className="space-y-2 pt-1">
                  {currentQ.options.map((opt) => {
                    const isSelected = followUpAnswers[currentQ.id] === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() =>
                          setFollowUpAnswers({ ...followUpAnswers, [currentQ.id]: opt })
                        }
                        className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between gap-3 cursor-pointer transition-all ${
                          isSelected
                            ? "bg-teal-50/80 border-teal-600 text-teal-950 font-bold shadow-2xs ring-1 ring-teal-500"
                            : "bg-white border-slate-200 hover:border-slate-300 text-slate-800 hover:bg-slate-50/60"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                              isSelected
                                ? "border-teal-700 bg-teal-700 text-white"
                                : "border-slate-300 bg-white"
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <span className="text-xs sm:text-sm">{opt}</span>
                        </div>
                        {isSelected && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-100/80 px-2 py-0.5 rounded">
                            Selected
                          </span>
                        )}
                      </button>
                    );
                  })}

                  {/* "Other (Please specify)" Custom Choice Option */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (!isOtherSelected) {
                          setFollowUpAnswers({
                            ...followUpAnswers,
                            [currentQ.id]: "Other: "
                          });
                        }
                      }}
                      className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between gap-3 cursor-pointer transition-all ${
                        isOtherSelected
                          ? "bg-teal-50/80 border-teal-600 text-teal-950 font-bold shadow-2xs ring-1 ring-teal-500"
                          : "bg-white border-slate-200 hover:border-slate-300 text-slate-800 hover:bg-slate-50/60"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                            isOtherSelected
                              ? "border-teal-700 bg-teal-700 text-white"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {isOtherSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className="text-xs sm:text-sm font-semibold">
                          Other (Type your own answer)
                        </span>
                      </div>
                      {isOtherSelected && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-100/80 px-2 py-0.5 rounded">
                          Selected
                        </span>
                      )}
                    </button>

                    {/* Custom Text Field when "Other" is selected */}
                    {isOtherSelected && (
                      <div className="mt-2.5 p-3.5 bg-slate-100/80 rounded-xl border border-teal-300/80 space-y-1.5 animate-in fade-in duration-200">
                        <label className="text-[11px] font-bold text-teal-900 block">
                          Type your answer here in simple words:
                        </label>
                        <input
                          type="text"
                          autoFocus
                          value={otherCustomText}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFollowUpAnswers({
                              ...followUpAnswers,
                              [currentQ.id]: val.trim() ? `Other: ${val}` : "Other: "
                            });
                          }}
                          placeholder="Type what you feel here..."
                          className="w-full p-3 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 shadow-2xs"
                        />
                        {!otherCustomText.trim() && (
                          <p className="text-[11px] text-amber-700 font-bold flex items-center gap-1 pt-0.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>Please type your answer in the box above to continue.</span>
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Free Text Input */}
              {currentQ.type === "text" && (
                <div className="pt-1">
                  <input
                    type="text"
                    value={followUpAnswers[currentQ.id] || ""}
                    onChange={(e) =>
                      setFollowUpAnswers({ ...followUpAnswers, [currentQ.id]: e.target.value })
                    }
                    placeholder={currentQ.placeholder || "Describe in your own words..."}
                    className="w-full p-3.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 shadow-2xs"
                  />
                </div>
              )}

              {/* Validation Warning Alert if current question is unanswered */}
              {!isCurrentAnswered && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-semibold">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Please pick or type an answer to go to the next question.
                  </span>
                </div>
              )}

              {/* Question navigation controls */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200/80">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))
                  }
                  disabled={currentQuestionIndex === 0}
                  className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous Question</span>
                </button>

                {currentQuestionIndex < followUpQuestions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (isCurrentAnswered) {
                        setCurrentQuestionIndex(currentQuestionIndex + 1);
                      }
                    }}
                    disabled={!isCurrentAnswered}
                    className={`px-5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-all ${
                      isCurrentAnswered
                        ? "bg-teal-800 hover:bg-teal-900 text-white cursor-pointer"
                        : "bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed opacity-60"
                    }`}
                  >
                    <span>Next Question</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (allQuestionsAnswered) {
                        onContinue();
                      }
                    }}
                    disabled={!allQuestionsAnswered}
                    className={`px-5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-all ${
                      allQuestionsAnswered
                        ? "bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer"
                        : "bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed opacity-60"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Finish Questions &bull; Go to Reports</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Context summary (Symptoms, Timeline, Missing items) (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Extracted Symptoms Tags */}
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 block">
                Identified Clinical Symptoms ({extractedSymptoms.length})
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {extractedSymptoms.map((sym, idx) => (
                <div
                  key={idx}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 flex items-center gap-2 shadow-2xs"
                >
                  <span className="w-2 h-2 rounded-full bg-teal-600" />
                  <span>{sym}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setExtractedSymptoms(extractedSymptoms.filter((_, i) => i !== idx))
                    }
                    className="text-slate-400 hover:text-rose-600 text-xs cursor-pointer ml-1"
                    title="Remove symptom"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Dynamic Timeline */}
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <span className="text-xs font-bold text-slate-800 block flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-teal-700" />
              <span>Clinical Progression Timeline</span>
            </span>
            <div className="space-y-2.5 text-xs">
              {timeline.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs"
                >
                  <div className="w-16 font-bold text-teal-800 shrink-0 text-[11px]">
                    {item.date}
                  </div>
                  <div className="w-2 h-2 rounded-full bg-teal-600 mt-1 shrink-0" />
                  <div className="text-slate-700 flex-1 leading-snug">
                    <strong className="text-slate-900">{item.event}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Step Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Reports</span>
        </button>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onSaveDraft}
            disabled={isSavingDraft || isSubmitting}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-xs sm:text-sm rounded-xl flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>{isSavingDraft ? "Saving..." : "Save Draft"}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (allQuestionsAnswered) {
                onContinue();
              }
            }}
            disabled={!allQuestionsAnswered}
            className={`px-6 py-2.5 font-bold text-xs sm:text-sm rounded-xl flex items-center gap-2 shadow-sm transition-all ${
              allQuestionsAnswered
                ? "bg-teal-800 hover:bg-teal-900 text-white cursor-pointer"
                : "bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed opacity-60"
            }`}
          >
            <span>Continue to Address</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
