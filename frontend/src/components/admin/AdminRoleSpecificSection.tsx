"use client";

import React from "react";
import { UserRole } from "@/lib/auth-context";
import { Sparkles } from "lucide-react";

interface AdminRoleSpecificSectionProps {
  activeRole: UserRole;

  // Patient
  bloodGroup: string;
  setBloodGroup: (val: string) => void;
  disability: string;
  setDisability: (val: string) => void;
  isAffilatedToOrg: boolean;
  setIsAffilatedToOrg: (val: boolean) => void;
  patientOrgName: string;
  setPatientOrgName: (val: string) => void;
  idInOrg: string;
  setIdInOrg: (val: string) => void;
  orgIdCard: string;
  setOrgIdCard: (val: string) => void;
  emergencyContactName: string;
  setEmergencyContactName: (val: string) => void;
  emergencyContactPhone: string;
  setEmergencyContactPhone: (val: string) => void;

  // Doctor
  medicalRegistrationNumber: string;
  setMedicalRegistrationNumber: (val: string) => void;
  doctorStateCouncilReg: string;
  setDoctorStateCouncilReg: (val: string) => void;
  doctorHprId: string;
  setDoctorHprId: (val: string) => void;
  doctorDesignation: string;
  setDoctorDesignation: (val: string) => void;
  qualification: string;
  setQualification: (val: string) => void;
  department: string;
  setDepartment: (val: string) => void;
  roomNumber: string;
  setRoomNumber: (val: string) => void;
  doctorShiftSchedule: string;
  setDoctorShiftSchedule: (val: string) => void;
  availabilityStatus: string;
  setAvailabilityStatus: (val: string) => void;
  isAuthorizedReviewer: boolean;
  setIsAuthorizedReviewer: (val: boolean) => void;

  // Nurse
  stateCouncilReg: string;
  setStateCouncilReg: (val: string) => void;
  hprId: string;
  setHprId: (val: string) => void;
  designation: string;
  setDesignation: (val: string) => void;
  shiftSchedule: string;
  setShiftSchedule: (val: string) => void;

  // Facility
  facilityHprId: string;
  setFacilityHprId: (val: string) => void;
  facilityDepartment: string;
  setFacilityDepartment: (val: string) => void;

  // Organization
  orgCode: string;
  setOrgCode: (val: string) => void;
  orgName: string;
  setOrgName: (val: string) => void;
  orgCategory: string;
  setOrgCategory: (val: string) => void;
  totalWorkforce: number | string;
  setTotalWorkforce: (val: number | string) => void;
  contactEmail: string;
  setContactEmail: (val: string) => void;

  // Healthcamp
  campId: string;
  setCampId: (val: string) => void;
  mmuUnitCode: string;
  setMmuUnitCode: (val: string) => void;
  campName: string;
  setCampName: (val: string) => void;
  leadOfficer: string;
  setLeadOfficer: (val: string) => void;
  operationalStatus: string;
  setOperationalStatus: (val: string) => void;
}

export const AdminRoleSpecificSection: React.FC<AdminRoleSpecificSectionProps> = ({
  activeRole,

  // Patient
  bloodGroup,
  setBloodGroup,
  disability,
  setDisability,
  isAffilatedToOrg,
  setIsAffilatedToOrg,
  patientOrgName,
  setPatientOrgName,
  idInOrg,
  setIdInOrg,
  orgIdCard,
  setOrgIdCard,
  emergencyContactName,
  setEmergencyContactName,
  emergencyContactPhone,
  setEmergencyContactPhone,

  // Doctor
  medicalRegistrationNumber,
  setMedicalRegistrationNumber,
  doctorStateCouncilReg,
  setDoctorStateCouncilReg,
  doctorHprId,
  setDoctorHprId,
  doctorDesignation,
  setDoctorDesignation,
  qualification,
  setQualification,
  department,
  setDepartment,
  roomNumber,
  setRoomNumber,
  doctorShiftSchedule,
  setDoctorShiftSchedule,
  availabilityStatus,
  setAvailabilityStatus,
  isAuthorizedReviewer,
  setIsAuthorizedReviewer,

  // Nurse
  stateCouncilReg,
  setStateCouncilReg,
  hprId,
  setHprId,
  designation,
  setDesignation,
  shiftSchedule,
  setShiftSchedule,

  // Facility
  facilityHprId,
  setFacilityHprId,
  facilityDepartment,
  setFacilityDepartment,

  // Organization
  orgCode,
  setOrgCode,
  orgName,
  setOrgName,
  orgCategory,
  setOrgCategory,
  totalWorkforce,
  setTotalWorkforce,
  contactEmail,
  setContactEmail,

  // Healthcamp
  campId,
  setCampId,
  mmuUnitCode,
  setMmuUnitCode,
  campName,
  setCampName,
  leadOfficer,
  setLeadOfficer,
  operationalStatus,
  setOperationalStatus,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-700 pb-2">
        <Sparkles className="w-4 h-4 text-emerald-400" />
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
          3. Role-Specific Details ({activeRole.toUpperCase()})
        </h2>
      </div>

      {/* PATIENT FIELDS */}
      {activeRole === "patient" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-700/60">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Blood Group</label>
            <select
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
            >
              {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((bg) => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Disability</label>
            <select
              value={disability}
              onChange={(e) => setDisability(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
            >
              <option value="No">No</option>
              <option value="Locomotor">Locomotor</option>
              <option value="Visual">Visual</option>
              <option value="Hearing">Hearing</option>
              <option value="Speech">Speech</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Affiliated to Organization?
            </label>
            <select
              value={isAffilatedToOrg ? "yes" : "no"}
              onChange={(e) => setIsAffilatedToOrg(e.target.value === "yes")}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
            >
              <option value="no">No (General Public)</option>
              <option value="yes">Yes (Employee / PSU / University)</option>
            </select>
          </div>

          {isAffilatedToOrg && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Organization Name
                </label>
                <input
                  type="text"
                  value={patientOrgName}
                  onChange={(e) => setPatientOrgName(e.target.value)}
                  placeholder="e.g. NALCO Smelter & Power Complex"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  ID in Organization (id_in_org)
                </label>
                <input
                  type="text"
                  value={idInOrg}
                  onChange={(e) => setIdInOrg(e.target.value)}
                  placeholder="e.g. NALCO-EMP-8841"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Organization ID Card URL (org_id_card)
                </label>
                <input
                  type="text"
                  value={orgIdCard}
                  onChange={(e) => setOrgIdCard(e.target.value)}
                  placeholder="https://... supabase storage URL or mock preview"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Emergency Contact Name</label>
            <input
              type="text"
              value={emergencyContactName}
              onChange={(e) => setEmergencyContactName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Emergency Contact Phone</label>
            <input
              type="text"
              value={emergencyContactPhone}
              onChange={(e) => setEmergencyContactPhone(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
            />
          </div>
        </div>
      )}

      {/* DOCTOR FIELDS */}
      {activeRole === "doctor" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-700/60">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Medical Reg. No (MCI / State Council) <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={medicalRegistrationNumber}
              onChange={(e) => setMedicalRegistrationNumber(e.target.value)}
              placeholder="e.g. MCI-OD-2012-9041"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              State Council Registration No.
            </label>
            <input
              type="text"
              value={doctorStateCouncilReg}
              onChange={(e) => setDoctorStateCouncilReg(e.target.value)}
              placeholder="e.g. MCI-OD-2012-9041"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              HPR ID (ABDM Healthcare Professional ID)
            </label>
            <input
              type="text"
              value={doctorHprId}
              onChange={(e) => setDoctorHprId(e.target.value)}
              placeholder="e.g. 91-7712-3321-4402@hpr"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-teal-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Designation &amp; Clinical Role
            </label>
            <input
              type="text"
              value={doctorDesignation}
              onChange={(e) => setDoctorDesignation(e.target.value)}
              placeholder="e.g. Senior Attending Physician &amp; Clinical Specialist"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Qualifications</label>
            <input
              type="text"
              value={qualification}
              onChange={(e) => setQualification(e.target.value)}
              placeholder="e.g. MBBS, MD"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Department</label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. Department of Medicine"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">OPD Room Number</label>
            <input
              type="text"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              placeholder="e.g. OPD Room 102"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Shift Schedule / Roster</label>
            <input
              type="text"
              value={doctorShiftSchedule}
              onChange={(e) => setDoctorShiftSchedule(e.target.value)}
              placeholder="e.g. Morning OPD (08:00 AM - 02:00 PM)"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Availability Status</label>
            <select
              value={availabilityStatus}
              onChange={(e) => setAvailabilityStatus(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
            >
              <option value="Available">Available</option>
              <option value="Busy">Busy</option>
              <option value="On Call">On Call</option>
              <option value="Offline">Offline</option>
            </select>
          </div>

          <div className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              id="authReviewer"
              checked={isAuthorizedReviewer}
              onChange={(e) => setIsAuthorizedReviewer(e.target.checked)}
              className="w-4 h-4 rounded text-teal-500 focus:ring-teal-400"
            />
            <label htmlFor="authReviewer" className="text-xs font-semibold text-slate-200 cursor-pointer">
              Authorized Clinical AI Reviewer
            </label>
          </div>
        </div>
      )}

      {/* NURSE FIELDS */}
      {activeRole === "nurse" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-700/60">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              State Council Reg No <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={stateCouncilReg}
              onChange={(e) => setStateCouncilReg(e.target.value)}
              placeholder="e.g. ONRC-2018-9941"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">ABDM HPR ID</label>
            <input
              type="text"
              value={hprId}
              onChange={(e) => setHprId(e.target.value)}
              placeholder="91-8821-4433-2011@hpr"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Designation</label>
            <input
              type="text"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
            />
          </div>

          <div className="col-span-1 sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1">Shift Schedule</label>
            <input
              type="text"
              value={shiftSchedule}
              onChange={(e) => setShiftSchedule(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
            />
          </div>
        </div>
      )}

      {/* FACILITY / MEDICAL FIELDS */}
      {(activeRole === "facility" || activeRole === "medical") && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-700/60">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              ABDM HPR ID (hpr_id) <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={facilityHprId}
              onChange={(e) => setFacilityHprId(e.target.value)}
              placeholder="e.g. 91-7712-3321-4402@hpr"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
            />
            <p className="text-[11px] text-slate-400 mt-1">Healthcare Professional Registry ID of facility incharge</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Department (department) <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={facilityDepartment}
              onChange={(e) => setFacilityDepartment(e.target.value)}
              placeholder="e.g. Central Pharmacy &amp; Lab"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
            />
            <p className="text-[11px] text-slate-400 mt-1">Primary operational wing or counter unit</p>
          </div>
        </div>
      )}

      {/* ORGANIZATION FIELDS */}
      {activeRole === "organization" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-700/60">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Org Code (org_code) <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={orgCode}
              onChange={(e) => setOrgCode(e.target.value)}
              placeholder="e.g. ORG-NALCO-01"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-teal-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Organization Official Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="National Aluminium Company Limited"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
            <select
              value={orgCategory}
              onChange={(e) => setOrgCategory(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
            >
              <option value="Public Sector Undertaking (PSU)">Public Sector Undertaking (PSU)</option>
              <option value="Corporate / Private Industry">Corporate / Private Industry</option>
              <option value="Educational Institute / University">Educational Institute / University</option>
              <option value="Government Department">Government Department</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Total Workforce Size</label>
            <input
              type="number"
              value={totalWorkforce}
              onChange={(e) => setTotalWorkforce(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
            />
          </div>

          <div className="col-span-1 sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Email</label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="health.desk@organization.com"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
            />
          </div>
        </div>
      )}

      {/* HEALTHCAMP FIELDS */}
      {activeRole === "healthcamp" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-700/60">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Camp ID (camp_id) <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={campId}
              onChange={(e) => setCampId(e.target.value)}
              placeholder="e.g. CMP-001"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-teal-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              MMU Fleet Unit Code <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={mmuUnitCode}
              onChange={(e) => setMmuUnitCode(e.target.value)}
              placeholder="MMU-OD-04"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Lead Medical Officer</label>
            <input
              type="text"
              value={leadOfficer}
              onChange={(e) => setLeadOfficer(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Operational Status</label>
            <select
              value={operationalStatus}
              onChange={(e) => setOperationalStatus(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
            >
              <option value="Active">Active (On Field Duty)</option>
              <option value="Standby">Standby (Depot / CHC)</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          </div>

          <div className="col-span-1 sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1">Camp Unit Name</label>
            <input
              type="text"
              value={campName}
              onChange={(e) => setCampName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
            />
          </div>
        </div>
      )}

      {/* ADMIN FIELDS */}
      {activeRole === "admin" && (
        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/60 text-xs text-slate-300">
          <p className="font-semibold text-teal-300">🛡️ System Administrator Role</p>
          <p className="mt-1 text-slate-400">
            Full administrative permissions across all facilities, audit logs, compliance rosters, and clinical overrides.
          </p>
        </div>
      )}
    </div>
  );
};
