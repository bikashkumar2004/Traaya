"use client";

import React from "react";
import {
  X,
  Edit3,
  Lock,
  Download,
  CheckCircle2,
  Loader2,
  Trash2,
  Plus,
} from "lucide-react";
import { generateDischargePdf } from "@/lib/generateDischargePdf";
import { DischargeReportPayload } from "@/app/api/doctor/generate-discharge/route";
import { CaseDetails } from "@/components/nurse/CaseReviewWorkspace";

interface DoctorDischargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  dischargeReportData: DischargeReportPayload | null;
  setDischargeReportData: React.Dispatch<React.SetStateAction<DischargeReportPayload | null>>;
  isEditingDischarge: boolean;
  setIsEditingDischarge: (val: boolean) => void;
  selectedCase: CaseDetails;
  isSavingDischarge: boolean;
  handleSaveAndAuthorizeDischarge: () => void;
}

export function DoctorDischargeModal({
  isOpen,
  onClose,
  dischargeReportData,
  setDischargeReportData,
  isEditingDischarge,
  setIsEditingDischarge,
  selectedCase,
  isSavingDischarge,
  handleSaveAndAuthorizeDischarge,
}: DoctorDischargeModalProps) {
  if (!isOpen || !dischargeReportData) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-5 sm:p-7 space-y-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 my-6 max-h-[92vh] flex flex-col">
        {/* Modal Sticky Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 shrink-0">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500">
                Govt. of Odisha Health Department
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Clinical Discharge Summary Verification
            </h2>
            <p className="text-xs text-slate-500">
              Review and verify all clinical findings, treatments, and prescriptions prior to authorizing patient discharge.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Mode Toggle: Preview vs Edit */}
            <button
              type="button"
              onClick={() => setIsEditingDischarge(!isEditingDischarge)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                isEditingDischarge
                  ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditingDischarge ? "Editing Report" : "Edit Report"}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Container */}
        <div className="overflow-y-auto pr-1 space-y-6 flex-1 text-slate-800 text-xs">
          {/* 1. Document Format & Metadata Header */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
              <span className="font-extrabold text-sm text-slate-900">Hospital Discharge Summary Format</span>
              <span className="text-[11px] text-teal-800 font-semibold">Standard NABH / Odisha Health Template</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 font-bold block">Document ID</span>
                <strong className="text-slate-900">{dischargeReportData.documentId}</strong>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 font-bold block">Document Version</span>
                <strong className="text-slate-900">{dischargeReportData.documentVersion}</strong>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 font-bold block">Document Category</span>
                <strong className="text-slate-900">{dischargeReportData.documentCategory}</strong>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 font-bold block">Issue Date</span>
                <strong className="text-slate-900">{dischargeReportData.issueDate}</strong>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 italic leading-relaxed">
              This document serves as a standardized template for recording patient discharge information. It provides a structured format to capture essential details about a patient&apos;s hospital stay, treatment, and condition at the time of discharge.
            </p>
          </div>

          {/* 2. Hospital Identification */}
          <div className="p-4 bg-teal-50/60 rounded-2xl border border-teal-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-base font-black text-teal-950">{dischargeReportData.hospitalName}</div>
              <div className="text-[11px] text-teal-900">{dischargeReportData.hospitalAddress}</div>
              <div className="text-[11px] text-teal-800 font-medium">{dischargeReportData.contactInfo}</div>
            </div>
            <div className="px-3 py-1 bg-white text-teal-900 border border-teal-300 rounded-xl text-[11px] font-bold shrink-0 self-start sm:self-center">
              Official Encounter Summary
            </div>
          </div>

          {/* 3. Patient Details Section */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="font-black text-slate-900 uppercase tracking-wide text-[11px] flex items-center justify-between border-b border-slate-100 pb-2">
              <span>Patient Details</span>
              <span className="text-[10px] text-slate-500 font-normal">Section 1</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Name</label>
                {isEditingDischarge ? (
                  <input
                    type="text"
                    value={dischargeReportData.patientDetails.name}
                    onChange={(e) =>
                      setDischargeReportData({
                        ...dischargeReportData,
                        patientDetails: { ...dischargeReportData.patientDetails, name: e.target.value },
                      })
                    }
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold focus:border-teal-600 outline-hidden"
                  />
                ) : (
                  <strong className="text-slate-900 font-extrabold">{dischargeReportData.patientDetails.name}</strong>
                )}
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Age / Sex</label>
                {isEditingDischarge ? (
                  <input
                    type="text"
                    value={dischargeReportData.patientDetails.ageSex}
                    onChange={(e) =>
                      setDischargeReportData({
                        ...dischargeReportData,
                        patientDetails: { ...dischargeReportData.patientDetails, ageSex: e.target.value },
                      })
                    }
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold focus:border-teal-600 outline-hidden"
                  />
                ) : (
                  <strong className="text-slate-900 font-semibold">{dischargeReportData.patientDetails.ageSex}</strong>
                )}
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Patient ID / MRN</label>
                {isEditingDischarge ? (
                  <input
                    type="text"
                    value={dischargeReportData.patientDetails.patientId}
                    onChange={(e) =>
                      setDischargeReportData({
                        ...dischargeReportData,
                        patientDetails: { ...dischargeReportData.patientDetails, patientId: e.target.value },
                      })
                    }
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold focus:border-teal-600 outline-hidden"
                  />
                ) : (
                  <strong className="text-slate-900 font-mono font-bold">{dischargeReportData.patientDetails.patientId}</strong>
                )}
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Date of Admission</label>
                {isEditingDischarge ? (
                  <input
                    type="text"
                    value={dischargeReportData.patientDetails.dateOfAdmission}
                    onChange={(e) =>
                      setDischargeReportData({
                        ...dischargeReportData,
                        patientDetails: { ...dischargeReportData.patientDetails, dateOfAdmission: e.target.value },
                      })
                    }
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold focus:border-teal-600 outline-hidden"
                  />
                ) : (
                  <span className="text-slate-800 font-medium">{dischargeReportData.patientDetails.dateOfAdmission}</span>
                )}
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Date of Discharge</label>
                {isEditingDischarge ? (
                  <input
                    type="text"
                    value={dischargeReportData.patientDetails.dateOfDischarge}
                    onChange={(e) =>
                      setDischargeReportData({
                        ...dischargeReportData,
                        patientDetails: { ...dischargeReportData.patientDetails, dateOfDischarge: e.target.value },
                      })
                    }
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold focus:border-teal-600 outline-hidden"
                  />
                ) : (
                  <span className="text-slate-800 font-medium">{dischargeReportData.patientDetails.dateOfDischarge}</span>
                )}
              </div>
            </div>
          </div>

          {/* 4. Admission Details */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="font-black text-slate-900 uppercase tracking-wide text-[11px] flex items-center justify-between border-b border-slate-100 pb-2">
              <span>Admission Details</span>
              <span className="text-[10px] text-slate-500 font-normal">Section 2</span>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  Reason for Admission / Presentation
                </label>
                {isEditingDischarge ? (
                  <textarea
                    rows={2}
                    value={dischargeReportData.admissionDetails.reasonForAdmission}
                    onChange={(e) =>
                      setDischargeReportData({
                        ...dischargeReportData,
                        admissionDetails: { ...dischargeReportData.admissionDetails, reasonForAdmission: e.target.value },
                      })
                    }
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium focus:border-teal-600 outline-hidden"
                  />
                ) : (
                  <p className="text-slate-800 font-medium leading-relaxed">
                    {dischargeReportData.admissionDetails.reasonForAdmission}
                  </p>
                )}
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Mode of Admission</label>
                {isEditingDischarge ? (
                  <input
                    type="text"
                    value={dischargeReportData.admissionDetails.modeOfAdmission}
                    onChange={(e) =>
                      setDischargeReportData({
                        ...dischargeReportData,
                        admissionDetails: { ...dischargeReportData.admissionDetails, modeOfAdmission: e.target.value },
                      })
                    }
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium focus:border-teal-600 outline-hidden"
                  />
                ) : (
                  <span className="inline-flex px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 font-bold text-[11px]">
                    {dischargeReportData.admissionDetails.modeOfAdmission}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 5. Clinical Summary */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <div className="font-black text-slate-900 uppercase tracking-wide text-[11px] flex items-center justify-between border-b border-slate-100 pb-2">
              <span>Clinical Summary &amp; Differential Diagnosis</span>
              <span className="text-[10px] text-slate-500 font-normal">Section 3</span>
            </div>
            {isEditingDischarge ? (
              <textarea
                rows={3}
                value={dischargeReportData.clinicalSummary}
                onChange={(e) =>
                  setDischargeReportData({
                    ...dischargeReportData,
                    clinicalSummary: e.target.value,
                  })
                }
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium focus:border-teal-600 outline-hidden"
              />
            ) : (
              <p className="text-slate-800 font-medium leading-relaxed whitespace-pre-line">
                {dischargeReportData.clinicalSummary}
              </p>
            )}
          </div>

          {/* 6. Treatment Provided */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <div className="font-black text-slate-900 uppercase tracking-wide text-[11px] flex items-center justify-between border-b border-slate-100 pb-2">
              <span>Treatment Provided &amp; Investigations</span>
              <span className="text-[10px] text-slate-500 font-normal">Section 4</span>
            </div>
            {isEditingDischarge ? (
              <textarea
                rows={2}
                value={dischargeReportData.treatmentProvided}
                onChange={(e) =>
                  setDischargeReportData({
                    ...dischargeReportData,
                    treatmentProvided: e.target.value,
                  })
                }
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium focus:border-teal-600 outline-hidden"
              />
            ) : (
              <p className="text-slate-800 font-medium leading-relaxed">
                {dischargeReportData.treatmentProvided}
              </p>
            )}
          </div>

          {/* 7. Discharge Condition */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <div className="font-black text-slate-900 uppercase tracking-wide text-[11px] flex items-center justify-between border-b border-slate-100 pb-2">
              <span>Condition on Discharge</span>
              <span className="text-[10px] text-slate-500 font-normal">Section 5</span>
            </div>
            {isEditingDischarge ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={dischargeReportData.dischargeCondition}
                  onChange={(e) =>
                    setDischargeReportData({
                      ...dischargeReportData,
                      dischargeCondition: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:border-teal-600 outline-hidden"
                />
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    "Recovered & Clinically Stable",
                    "Symptomatically Relieved",
                    "Afebrile & Ambulatory",
                    "Mild Symptoms - Home Care",
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() =>
                        setDischargeReportData({
                          ...dischargeReportData,
                          dischargeCondition: preset,
                        })
                      }
                      className="px-2 py-0.5 text-[10px] bg-slate-100 hover:bg-slate-200 rounded-md font-semibold text-slate-700 cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {dischargeReportData.dischargeCondition}
                </span>
              </div>
            )}
          </div>

          {/* 8. Prescribed Medications at Discharge */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="font-black text-slate-900 uppercase tracking-wide text-[11px] flex items-center justify-between border-b border-slate-100 pb-2">
              <span>Prescribed Medications at Discharge</span>
              <span className="text-[10px] text-slate-500 font-normal">Section 6</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold text-[10px] uppercase bg-slate-50">
                    <th className="p-2 w-8">#</th>
                    <th className="p-2">Medication Name</th>
                    <th className="p-2">Dosage</th>
                    <th className="p-2">Frequency</th>
                    <th className="p-2">Duration</th>
                    {isEditingDischarge && <th className="p-2 w-10 text-center">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dischargeReportData.prescribedMedications.map((med, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      <td className="p-2 font-bold text-slate-500">{idx + 1}</td>
                      <td className="p-2 font-bold text-slate-800">
                        {isEditingDischarge ? (
                          <input
                            type="text"
                            value={med.name}
                            onChange={(e) => {
                              const next = [...dischargeReportData.prescribedMedications];
                              next[idx].name = e.target.value;
                              setDischargeReportData({ ...dischargeReportData, prescribedMedications: next });
                            }}
                            className="w-full px-2 py-1 border border-slate-300 rounded-md text-xs font-semibold focus:border-teal-600 outline-hidden"
                          />
                        ) : (
                          med.name
                        )}
                      </td>
                      <td className="p-2 text-slate-700">
                        {isEditingDischarge ? (
                          <input
                            type="text"
                            value={med.dosage}
                            onChange={(e) => {
                              const next = [...dischargeReportData.prescribedMedications];
                              next[idx].dosage = e.target.value;
                              setDischargeReportData({ ...dischargeReportData, prescribedMedications: next });
                            }}
                            className="w-full px-2 py-1 border border-slate-300 rounded-md text-xs focus:border-teal-600 outline-hidden"
                          />
                        ) : (
                          med.dosage
                        )}
                      </td>
                      <td className="p-2 text-slate-700">
                        {isEditingDischarge ? (
                          <input
                            type="text"
                            value={med.frequency}
                            onChange={(e) => {
                              const next = [...dischargeReportData.prescribedMedications];
                              next[idx].frequency = e.target.value;
                              setDischargeReportData({ ...dischargeReportData, prescribedMedications: next });
                            }}
                            className="w-full px-2 py-1 border border-slate-300 rounded-md text-xs focus:border-teal-600 outline-hidden"
                          />
                        ) : (
                          med.frequency
                        )}
                      </td>
                      <td className="p-2 text-slate-700">
                        {isEditingDischarge ? (
                          <input
                            type="text"
                            value={med.duration}
                            onChange={(e) => {
                              const next = [...dischargeReportData.prescribedMedications];
                              next[idx].duration = e.target.value;
                              setDischargeReportData({ ...dischargeReportData, prescribedMedications: next });
                            }}
                            className="w-full px-2 py-1 border border-slate-300 rounded-md text-xs focus:border-teal-600 outline-hidden"
                          />
                        ) : (
                          med.duration
                        )}
                      </td>
                      {isEditingDischarge && (
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              const next = dischargeReportData.prescribedMedications.filter((_, i) => i !== idx);
                              setDischargeReportData({ ...dischargeReportData, prescribedMedications: next });
                            }}
                            className="p-1 text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {isEditingDischarge && (
              <button
                type="button"
                onClick={() => {
                  const next = [
                    ...dischargeReportData.prescribedMedications,
                    { name: "New Generic Medicine", dosage: "1 Tablet", frequency: "OD", duration: "3 days" },
                  ];
                  setDischargeReportData({ ...dischargeReportData, prescribedMedications: next });
                }}
                className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Medication</span>
              </button>
            )}
          </div>

          {/* 9. Follow-Up Instructions */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="font-black text-slate-900 uppercase tracking-wide text-[11px] flex items-center justify-between border-b border-slate-100 pb-2">
              <span>Follow-Up Instructions</span>
              <span className="text-[10px] text-slate-500 font-normal">Section 7</span>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  1. Recommended Follow-Up
                </label>
                {isEditingDischarge ? (
                  <input
                    type="text"
                    value={dischargeReportData.followUpInstructions.recommendedFollowUp}
                    onChange={(e) =>
                      setDischargeReportData({
                        ...dischargeReportData,
                        followUpInstructions: {
                          ...dischargeReportData.followUpInstructions,
                          recommendedFollowUp: e.target.value,
                        },
                      })
                    }
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium focus:border-teal-600 outline-hidden"
                  />
                ) : (
                  <p className="text-slate-800 font-medium">
                    {dischargeReportData.followUpInstructions.recommendedFollowUp}
                  </p>
                )}
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  2. Next Follow-Up Date / Guidance
                </label>
                {isEditingDischarge ? (
                  <input
                    type="text"
                    value={dischargeReportData.followUpInstructions.nextFollowUpDate}
                    onChange={(e) =>
                      setDischargeReportData({
                        ...dischargeReportData,
                        followUpInstructions: {
                          ...dischargeReportData.followUpInstructions,
                          nextFollowUpDate: e.target.value,
                        },
                      })
                    }
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium focus:border-teal-600 outline-hidden"
                  />
                ) : (
                  <p className="text-slate-800 font-medium">
                    {dischargeReportData.followUpInstructions.nextFollowUpDate}
                  </p>
                )}
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  3. Lifestyle / Dietary Instructions
                </label>
                {isEditingDischarge ? (
                  <textarea
                    rows={2}
                    value={dischargeReportData.followUpInstructions.lifestyleDietaryInstructions}
                    onChange={(e) =>
                      setDischargeReportData({
                        ...dischargeReportData,
                        followUpInstructions: {
                          ...dischargeReportData.followUpInstructions,
                          lifestyleDietaryInstructions: e.target.value,
                        },
                      })
                    }
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium focus:border-teal-600 outline-hidden"
                  />
                ) : (
                  <p className="text-slate-800 font-medium leading-relaxed">
                    {dischargeReportData.followUpInstructions.lifestyleDietaryInstructions}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 10. Signatures and Disclaimer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Doctor Signature Block */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Physician Name &amp; Signature</div>
              <div className="font-extrabold text-slate-900">{dischargeReportData.physician.name}</div>
              <div className="text-[11px] text-slate-600">{dischargeReportData.physician.qualification} &bull; Reg: {dischargeReportData.physician.regNo}</div>
              <div className="pt-2 text-[10px] font-bold text-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Digitally Verified &amp; Authorized Physician</span>
              </div>
            </div>

            {/* Patient Acknowledgment */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Patient Acknowledgment</div>
              <p className="text-[11px] text-slate-600 italic">
                &ldquo;I acknowledge that I have received and understood the above discharge summary and instructions.&rdquo;
              </p>
              <div className="pt-2 text-[10px] font-semibold text-slate-500">
                Patient / Guardian Signed on File &bull; Date: {dischargeReportData.patientDetails.dateOfDischarge}
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="p-3 bg-slate-100 rounded-xl text-[10px] text-slate-500 leading-relaxed border border-slate-200">
            <strong className="text-slate-700">Disclaimer: </strong>
            {dischargeReportData.disclaimer}
          </div>
        </div>

        {/* Modal Sticky Bottom Action Bar */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span>
              Authorization will generate the NABH PDF, upload to Supabase storage, record in DB, and discharge patient.
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Download PDF Preview */}
            <button
              type="button"
              onClick={() => {
                const doc = generateDischargePdf(dischargeReportData);
                doc.save(`${selectedCase.patientId || selectedCase.id}_Discharge_Summary.pdf`);
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-300"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>

            {/* Verify & Complete Discharge */}
            <button
              type="button"
              disabled={isSavingDischarge}
              onClick={handleSaveAndAuthorizeDischarge}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              {isSavingDischarge ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Saving PDF &amp; Completing Discharge...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Verify &amp; Authorize Discharge</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
