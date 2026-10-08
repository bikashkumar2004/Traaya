"use client";

import React from "react";
import { HeartPulse } from "lucide-react";
import { ChronicCondition, DrugAllergy } from "@/lib/auth-context";
import { PatientChronicConditionsSection } from "./PatientChronicConditionsSection";
import { PatientAllergiesSection } from "./PatientAllergiesSection";

export interface PatientMedicalProfileCardProps {
  chronicConditions: ChronicCondition[];
  showAddCondition: boolean;
  setShowAddCondition: (val: boolean) => void;
  newConditionName: string;
  setNewConditionName: (val: string) => void;
  newConditionYear: string;
  setNewConditionYear: (val: string) => void;
  newConditionNotes: string;
  setNewConditionNotes: (val: string) => void;
  onAddCondition: (e: React.FormEvent) => void;
  onDeleteCondition: (id: string) => void;

  allergies: DrugAllergy[];
  showAddAllergy: boolean;
  setShowAddAllergy: (val: boolean) => void;
  newAllergenName: string;
  setNewAllergenName: (val: string) => void;
  newAllergySeverity: "Severe" | "Moderate" | "Mild";
  setNewAllergySeverity: (val: "Severe" | "Moderate" | "Mild") => void;
  newAllergyReaction: string;
  setNewAllergyReaction: (val: string) => void;
  onAddAllergy: (e: React.FormEvent) => void;
  onDeleteAllergy: (id: string) => void;
}

export function PatientMedicalProfileCard({
  chronicConditions,
  showAddCondition,
  setShowAddCondition,
  newConditionName,
  setNewConditionName,
  newConditionYear,
  setNewConditionYear,
  newConditionNotes,
  setNewConditionNotes,
  onAddCondition,
  onDeleteCondition,
  allergies,
  showAddAllergy,
  setShowAddAllergy,
  newAllergenName,
  setNewAllergenName,
  newAllergySeverity,
  setNewAllergySeverity,
  newAllergyReaction,
  setNewAllergyReaction,
  onAddAllergy,
  onDeleteAllergy,
}: PatientMedicalProfileCardProps) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
        <div>
          <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-teal-700" />
            <span>Medical Background &amp; Health Profile</span>
          </h3>
          <span className="text-xs text-slate-500">
            Directly factored into clinical triage safety scoring. Connected to database.
          </span>
        </div>
      </div>

      {/* DYNAMIC SECTION A: Diagnosed Chronic Conditions */}
      <PatientChronicConditionsSection
        chronicConditions={chronicConditions}
        showAddCondition={showAddCondition}
        setShowAddCondition={setShowAddCondition}
        newConditionName={newConditionName}
        setNewConditionName={setNewConditionName}
        newConditionYear={newConditionYear}
        setNewConditionYear={setNewConditionYear}
        newConditionNotes={newConditionNotes}
        setNewConditionNotes={setNewConditionNotes}
        onAddCondition={onAddCondition}
        onDeleteCondition={onDeleteCondition}
      />

      {/* DYNAMIC SECTION B: Known Drug Allergies & Sensitivities */}
      <PatientAllergiesSection
        allergies={allergies}
        showAddAllergy={showAddAllergy}
        setShowAddAllergy={setShowAddAllergy}
        newAllergenName={newAllergenName}
        setNewAllergenName={setNewAllergenName}
        newAllergySeverity={newAllergySeverity}
        setNewAllergySeverity={setNewAllergySeverity}
        newAllergyReaction={newAllergyReaction}
        setNewAllergyReaction={setNewAllergyReaction}
        onAddAllergy={onAddAllergy}
        onDeleteAllergy={onDeleteAllergy}
      />
    </div>
  );
}
