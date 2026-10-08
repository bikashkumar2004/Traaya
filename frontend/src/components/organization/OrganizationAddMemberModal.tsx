"use client";

import React from "react";
import { Building2, X } from "lucide-react";

interface OrganizationAddMemberModalProps {
  showModal: boolean;
  onClose: () => void;
  selectedOrgName: string;
  bloodGroupsList: string[];
  newPatientCategory: "Employee" | "Student";
  setNewPatientCategory: (val: "Employee" | "Student") => void;
  newPatientName: string;
  setNewPatientName: (val: string) => void;
  newPatientAge: number | string;
  setNewPatientAge: (val: number | string) => void;
  newPatientGender: string;
  setNewPatientGender: (val: string) => void;
  newPatientBloodGroup: string;
  setNewPatientBloodGroup: (val: string) => void;
  newPatientMemberId: string;
  setNewPatientMemberId: (val: string) => void;
  newPatientDepartment: string;
  setNewPatientDepartment: (val: string) => void;
  newPatientPhone: string;
  setNewPatientPhone: (val: string) => void;
  newPatientAddress: string;
  setNewPatientAddress: (val: string) => void;
  newPatientSymptoms: string;
  setNewPatientSymptoms: (val: string) => void;
  newPatientIdCardFileName: string;
  setNewPatientIdCardFileName: (val: string) => void;
  newPatientIdCardPreview: string;
  setNewPatientIdCardPreview: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const OrganizationAddMemberModal: React.FC<OrganizationAddMemberModalProps> = ({
  showModal,
  onClose,
  selectedOrgName,
  bloodGroupsList,
  newPatientCategory,
  setNewPatientCategory,
  newPatientName,
  setNewPatientName,
  newPatientAge,
  setNewPatientAge,
  newPatientGender,
  setNewPatientGender,
  newPatientBloodGroup,
  setNewPatientBloodGroup,
  newPatientMemberId,
  setNewPatientMemberId,
  newPatientDepartment,
  setNewPatientDepartment,
  newPatientPhone,
  setNewPatientPhone,
  newPatientAddress,
  setNewPatientAddress,
  newPatientSymptoms,
  setNewPatientSymptoms,
  newPatientIdCardFileName,
  setNewPatientIdCardFileName,
  setNewPatientIdCardPreview,
  onSubmit,
}) => {
  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-teal-700" />
            <h3 className="text-base font-black text-slate-900">
              Add Employee / Student to Roster &bull; {selectedOrgName}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 text-xs">
          {/* Category Selector */}
          <div className="space-y-1">
            <label className="font-bold text-slate-800 block">Member Type / Category *</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setNewPatientCategory("Employee")}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  newPatientCategory === "Employee"
                    ? "bg-teal-800 text-white border-teal-900 shadow-xs"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <span>Employee / Staff</span>
              </button>
              <button
                type="button"
                onClick={() => setNewPatientCategory("Student")}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  newPatientCategory === "Student"
                    ? "bg-teal-800 text-white border-teal-900 shadow-xs"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <span>Student / Scholar</span>
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-800 block">Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Ramesh Chandra Das"
              value={newPatientName}
              onChange={(e) => setNewPatientName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-teal-700"
            />
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="font-bold text-slate-800 block">Age *</label>
              <input
                type="number"
                required
                placeholder="e.g. 38"
                value={newPatientAge}
                onChange={(e) => setNewPatientAge(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-teal-700"
              />
            </div>

            <div>
              <label className="font-bold text-slate-800 block">Gender</label>
              <select
                value={newPatientGender}
                onChange={(e) => setNewPatientGender(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-teal-700 cursor-pointer"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Others">Others</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-800 block">Blood Group *</label>
              <select
                value={newPatientBloodGroup}
                onChange={(e) => setNewPatientBloodGroup(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold focus:outline-teal-700 cursor-pointer text-rose-700"
              >
                {bloodGroupsList.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="font-bold text-slate-800 block">Employee / Member ID *</label>
              <input
                type="text"
                required
                placeholder="e.g. NAL-8891"
                value={newPatientMemberId}
                onChange={(e) => setNewPatientMemberId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-teal-700"
              />
            </div>

            <div>
              <label className="font-bold text-slate-800 block">Department</label>
              <input
                type="text"
                placeholder="e.g. Smelter / Transport"
                value={newPatientDepartment}
                onChange={(e) => setNewPatientDepartment(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-teal-700"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-800 block">Contact Phone Number</label>
            <input
              type="text"
              placeholder="+91 94371 00000"
              value={newPatientPhone}
              onChange={(e) => setNewPatientPhone(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-teal-700"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-800 block">Residential Address</label>
            <input
              type="text"
              placeholder="e.g. Quarter B-18, Nalco Township"
              value={newPatientAddress}
              onChange={(e) => setNewPatientAddress(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-teal-700"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-800 block">Latest Symptoms (comma separated)</label>
            <input
              type="text"
              placeholder="e.g. Fever, Cough (or leave as Routine Checkup)"
              value={newPatientSymptoms}
              onChange={(e) => setNewPatientSymptoms(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-teal-700"
            />
          </div>

          {/* Upload ID Card Demo */}
          <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl space-y-2">
            <label className="font-bold text-slate-800 block">Organisation ID Card</label>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-600">
                {newPatientIdCardFileName ? newPatientIdCardFileName : "Demo verified badge will be attached"}
              </span>
              <button
                type="button"
                onClick={() => {
                  setNewPatientIdCardFileName("employee_id_card.png");
                  setNewPatientIdCardPreview(
                    "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&auto=format&fit=crop&q=60"
                  );
                }}
                className="px-2.5 py-1 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-[10px] font-bold cursor-pointer"
              >
                Attach Demo ID
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold cursor-pointer shadow-xs"
            >
              Enroll Patient
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
