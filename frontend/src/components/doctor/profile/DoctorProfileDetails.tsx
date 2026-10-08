"use client";

import React from "react";
import {
  User,
  PhoneCall,
  Mail,
  Calendar,
  FileCheck,
} from "lucide-react";

interface DoctorProfileDetailsProps {
  editMode: boolean;
  fullName: string;
  setFullName: (val: string) => void;
  designation: string;
  setDesignation: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  email: string;
  gender: string;
  setGender: (val: string) => void;
  bloodGroup: string;
  setBloodGroup: (val: string) => void;
  dob: string;
  setDob: (val: string) => void;
  staffId: string;
  councilReg: string;
  setCouncilReg: (val: string) => void;
  hprId: string;
  setHprId: (val: string) => void;
  facility: string;
  setFacility: (val: string) => void;
  qualification: string;
  setQualification: (val: string) => void;
  shift: string;
  setShift: (val: string) => void;
}

export function DoctorProfileDetails({
  editMode,
  fullName,
  setFullName,
  designation,
  setDesignation,
  phone,
  setPhone,
  email,
  gender,
  setGender,
  bloodGroup,
  setBloodGroup,
  dob,
  setDob,
  staffId,
  councilReg,
  setCouncilReg,
  hprId,
  setHprId,
  facility,
  setFacility,
  qualification,
  setQualification,
  shift,
  setShift,
}: DoctorProfileDetailsProps) {
  return (
    <div className="space-y-6">
      {/* Card: Personal Information */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <User className="w-4 h-4 text-teal-700" />
          <h2 className="text-sm font-bold text-slate-900">
            Personal Demographics (Live Supabase Profile)
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-500 font-medium mb-1">
              Full Name
            </label>
            {editMode ? (
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-teal-600 font-semibold"
              />
            ) : (
              <div className="font-bold text-slate-800 py-1">{fullName}</div>
            )}
          </div>

          <div>
            <label className="block text-slate-500 font-medium mb-1">
              Designation / Role
            </label>
            {editMode ? (
              <input
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-teal-600 font-semibold"
              />
            ) : (
              <div className="font-bold text-slate-800 py-1">{designation}</div>
            )}
          </div>

          <div>
            <label className="block text-slate-500 font-medium mb-1">
              Mobile Contact
            </label>
            {editMode ? (
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-teal-600 font-semibold"
              />
            ) : (
              <div className="font-bold text-slate-800 py-1 flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5 text-slate-400" />
                <span>{phone}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-slate-500 font-medium mb-1">
              Official Email
            </label>
            <div className="font-bold text-slate-800 py-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span className="truncate">{email}</span>
            </div>
          </div>

          <div>
            <label className="block text-slate-500 font-medium mb-1">
              Gender &bull; Blood Group
            </label>
            {editMode ? (
              <div className="flex gap-2">
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-1/2 px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-teal-600 font-semibold"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-1/2 px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-teal-600 font-semibold"
                >
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
            ) : (
              <div className="font-bold text-slate-800 py-1">
                {gender} &bull; {bloodGroup}
              </div>
            )}
          </div>

          <div>
            <label className="block text-slate-500 font-medium mb-1">
              Date of Birth
            </label>
            {editMode ? (
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-teal-600 text-xs font-semibold"
              />
            ) : (
              <div className="font-bold text-slate-800 py-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{dob}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card: Professional & Government Registration */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <FileCheck className="w-4 h-4 text-teal-700" />
          <h2 className="text-sm font-bold text-slate-900">
            Medical Council &amp; Government Credentials
          </h2>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <span className="text-slate-500">Doctor ID (Universal Role Identifier)</span>
            <span className="font-bold text-slate-900 font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
              {staffId}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <span className="text-slate-500">State Medical Council Reg. (MCI / NMC / OMC)</span>
            {editMode ? (
              <input
                type="text"
                value={councilReg}
                onChange={(e) => setCouncilReg(e.target.value)}
                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-right font-semibold"
              />
            ) : (
              <span className="font-bold text-slate-900 font-mono">{councilReg}</span>
            )}
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <span className="text-slate-500">Health Professional Registry (HPR ID)</span>
            {editMode ? (
              <input
                type="text"
                value={hprId}
                onChange={(e) => setHprId(e.target.value)}
                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-right font-semibold"
              />
            ) : (
              <span className="font-bold text-teal-800 font-mono">{hprId}</span>
            )}
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <span className="text-slate-500">Primary Health Facility</span>
            {editMode ? (
              <input
                type="text"
                value={facility}
                onChange={(e) => setFacility(e.target.value)}
                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-right font-semibold"
              />
            ) : (
              <span className="font-bold text-slate-900">{facility}</span>
            )}
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <span className="text-slate-500">Qualifications</span>
            {editMode ? (
              <input
                type="text"
                value={qualification}
                onChange={(e) => setQualification(e.target.value)}
                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-right font-semibold"
              />
            ) : (
              <span className="font-semibold text-slate-800">{qualification}</span>
            )}
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-slate-500">Duty Shift Timings / OPD Roster</span>
            {editMode ? (
              <input
                type="text"
                value={shift}
                onChange={(e) => setShift(e.target.value)}
                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-right font-semibold"
              />
            ) : (
              <span className="font-semibold text-slate-800">{shift}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
