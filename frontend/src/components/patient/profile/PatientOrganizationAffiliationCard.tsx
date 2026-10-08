"use client";

import React, { useState } from "react";
import {
  Building2,
  FileBadge,
  Eye,
  Plus,
  X,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Loader2,
  Edit2,
  Trash2,
} from "lucide-react";
import {
  REGISTERED_ORGANIZATIONS,
  verifyOrganizationMember,
  RegisteredOrganization,
} from "@/lib/organization-data";
import { supabase } from "@/lib/supabase";

export interface OrganizationAffiliationData {
  organizationId?: string;
  organizationName?: string;
  organizationCode?: string;
  memberId?: string;
  department?: string;
  category?: string;
  isOrganizationVerified?: boolean;
  idCardUrl?: string;
}

export interface PatientOrganizationAffiliationCardProps {
  organizationAffiliation: OrganizationAffiliationData | null;
  onViewIdCard: () => void;
  onSaveAffiliation?: (data: OrganizationAffiliationData) => Promise<void> | void;
  onRemoveAffiliation?: () => Promise<void> | void;
  patientUhid?: string;
}

export function PatientOrganizationAffiliationCard({
  organizationAffiliation,
  onViewIdCard,
  onSaveAffiliation,
  onRemoveAffiliation,
  patientUhid = "PATIENT",
}: PatientOrganizationAffiliationCardProps) {
  const [showForm, setShowForm] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<string>(
    organizationAffiliation?.organizationId || REGISTERED_ORGANIZATIONS[0]?.id || "org-nalco"
  );
  const [employeeId, setEmployeeId] = useState<string>(
    organizationAffiliation?.memberId || ""
  );
  const [department, setDepartment] = useState<string>(
    organizationAffiliation?.department || ""
  );
  const [category, setCategory] = useState<string>(
    organizationAffiliation?.category || "Employee"
  );
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [idCardFileName, setIdCardFileName] = useState<string>("");
  const [idCardPreview, setIdCardPreview] = useState<string>(
    organizationAffiliation?.idCardUrl || ""
  );
  const [verificationStatus, setVerificationStatus] = useState<{
    verified: boolean;
    member?: any;
    message: string;
  } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenForm = () => {
    if (organizationAffiliation) {
      setSelectedOrgId(organizationAffiliation.organizationId || REGISTERED_ORGANIZATIONS[0]?.id || "org-nalco");
      setEmployeeId(organizationAffiliation.memberId || "");
      setDepartment(organizationAffiliation.department || "");
      setCategory(organizationAffiliation.category || "Employee");
      setIdCardPreview(organizationAffiliation.idCardUrl || "");
      setIdCardFileName("");
      setIdCardFile(null);
    } else {
      setSelectedOrgId(REGISTERED_ORGANIZATIONS[0]?.id || "org-nalco");
      setEmployeeId("");
      setDepartment("");
      setCategory("Employee");
      setIdCardPreview("");
      setIdCardFileName("");
      setIdCardFile(null);
    }
    setVerificationStatus(null);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setVerificationStatus(null);
    setIdCardFile(null);
  };

  const handleVerifyAffiliation = () => {
    if (!employeeId.trim()) return;
    setIsVerifying(true);
    setTimeout(() => {
      const res = verifyOrganizationMember(selectedOrgId, employeeId.trim());
      setVerificationStatus(res);
      if (res.verified && res.member) {
        if (res.member.department) setDepartment(res.member.department);
        if (res.member.category) setCategory(res.member.category);
      }
      setIsVerifying(false);
    }, 350);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIdCardFile(file);
    setIdCardFileName(file.name);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => {
        setIdCardPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setIdCardPreview("");
    }
  };

  const handleRemoveFile = () => {
    setIdCardFile(null);
    setIdCardFileName("");
    setIdCardPreview("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId.trim()) {
      alert("Please provide your Employee / Student / Member ID.");
      return;
    }

    setIsSubmitting(true);
    try {
      let finalCardUrl = idCardPreview;

      // Try uploading to Supabase Storage if file exists
      if (idCardFile && supabase) {
        try {
          const ext = idCardFile.name.split(".").pop() || "png";
          const fileName = `${patientUhid}_${Date.now()}.${ext}`;
          const { data: uploadData, error: uploadErr } = await supabase.storage
            .from("org-id-cards")
            .upload(fileName, idCardFile, {
              cacheControl: "3600",
              upsert: true,
            });

          if (!uploadErr && uploadData) {
            const { data: publicUrlData } = supabase.storage
              .from("org-id-cards")
              .getPublicUrl(fileName);
            if (publicUrlData?.publicUrl) {
              finalCardUrl = publicUrlData.publicUrl;
            }
          }
        } catch (storageErr) {
          console.warn("Storage upload error:", storageErr);
        }
      }

      const org = REGISTERED_ORGANIZATIONS.find((o) => o.id === selectedOrgId) || REGISTERED_ORGANIZATIONS[0];

      if (onSaveAffiliation) {
        await onSaveAffiliation({
          organizationId: org.id,
          organizationName: org.name,
          organizationCode: org.code,
          memberId: employeeId.trim(),
          department: department.trim() || "Operations",
          category,
          isOrganizationVerified: Boolean(verificationStatus?.verified),
          idCardUrl: finalCardUrl,
        });
      }

      setShowForm(false);
    } catch (err) {
      console.error("Error saving organization affiliation:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div>
          <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-teal-700" />
            <span>Organisation &amp; Institutional Affiliation</span>
          </h3>
          <p className="text-xs text-slate-500">
            Official occupational or campus health registry affiliation verified against organisation records.
          </p>
        </div>

        {!showForm && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {organizationAffiliation ? (
              <>
                <button
                  type="button"
                  onClick={handleOpenForm}
                  className="px-3.5 py-1.5 bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Update Affiliation</span>
                </button>
                {onRemoveAffiliation && (
                  <button
                    type="button"
                    onClick={onRemoveAffiliation}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title="Remove Affiliation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </>
            ) : (
              <button
                type="button"
                onClick={handleOpenForm}
                className="px-3.5 py-1.5 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Affiliate to Organisation</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Affiliation Form (Same fields requested at register time) */}
      {showForm ? (
        <form
          onSubmit={handleSubmit}
          className="p-5 sm:p-6 bg-teal-50/50 rounded-2xl border border-teal-200/90 space-y-4 animate-in fade-in"
        >
          <div className="flex items-center justify-between border-b border-teal-100 pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-teal-700" />
              <span className="text-xs font-black uppercase tracking-wider text-teal-950">
                {organizationAffiliation ? "Update Organisation Affiliation" : "Affiliate to Organisation"}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCloseForm}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            {/* 1. Choose Organisation Dropdown */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-800">
                Choose Organisation (Already Registered) <span className="text-rose-600">*</span>
              </label>
              <select
                value={selectedOrgId}
                onChange={(e) => {
                  setSelectedOrgId(e.target.value);
                  setVerificationStatus(null);
                }}
                className="w-full text-xs px-3.5 py-2.5 bg-white border border-teal-300 rounded-xl text-slate-900 focus:outline-teal-700 font-semibold cursor-pointer"
              >
                {REGISTERED_ORGANIZATIONS.map((org: RegisteredOrganization) => (
                  <option key={org.id} value={org.id}>
                    {org.name} ({org.code} &bull; {org.district})
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Employee / Student / Member ID with Instant Verify Button */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                Employee / Student / Member ID <span className="text-rose-600">*</span>
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    required
                    placeholder="e.g. NAL-4019, NAL-3882, or your assigned ID"
                    value={employeeId}
                    onChange={(e) => {
                      setEmployeeId(e.target.value);
                      setVerificationStatus(null);
                    }}
                    className={`w-full text-xs px-3.5 py-2.5 bg-white border rounded-xl text-slate-900 focus:outline-teal-700 font-mono font-bold ${
                      verificationStatus?.verified
                        ? "border-emerald-500 ring-2 ring-emerald-500/20"
                        : verificationStatus && !verificationStatus.verified
                        ? "border-rose-400 ring-2 ring-rose-400/20"
                        : "border-teal-300"
                    }`}
                  />
                  {verificationStatus?.verified && (
                    <span className="absolute right-3 top-2.5 text-emerald-600 font-bold text-xs flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Verified</span>
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleVerifyAffiliation}
                  disabled={!employeeId.trim() || isVerifying}
                  className="px-4 py-2.5 bg-teal-800 hover:bg-teal-900 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
                >
                  {isVerifying ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-4 h-4" />
                  )}
                  <span>{verificationStatus?.verified ? "Re-verify" : "Verify ID"}</span>
                </button>
              </div>

              {/* Verification Result Feedback */}
              {verificationStatus && (
                <div
                  className={`p-3 rounded-xl border text-xs font-medium flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1 ${
                    verificationStatus.verified
                      ? "bg-emerald-50 border-emerald-300 text-emerald-950"
                      : "bg-amber-50 border-amber-300 text-amber-950"
                  }`}
                >
                  {verificationStatus.verified ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 space-y-0.5">
                    <p className="font-bold">{verificationStatus.message}</p>
                    {verificationStatus.verified && verificationStatus.member && (
                      <div className="flex items-center gap-2 flex-wrap text-[11px] text-emerald-800 font-semibold pt-0.5">
                        <span>Roster Name: <strong>{verificationStatus.member.name}</strong></span>
                        <span>&bull;</span>
                        <span>Category: <strong>{verificationStatus.member.category}</strong></span>
                        <span>&bull;</span>
                        <span>Department: <strong>{verificationStatus.member.department || "Operations"}</strong></span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 3. Department and Category Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-800">
                  Department / Division
                </label>
                <input
                  type="text"
                  placeholder="e.g. Operations, IT, Mechanical, Research"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-white border border-teal-300 rounded-xl text-slate-900 focus:outline-teal-700 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-800">
                  Affiliation Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-white border border-teal-300 rounded-xl text-slate-900 focus:outline-teal-700 font-semibold cursor-pointer"
                >
                  <option value="Employee">Employee</option>
                  <option value="Student">Student</option>
                  <option value="Staff">Staff</option>
                  <option value="Faculty">Faculty</option>
                  <option value="Contractor">Contractor</option>
                  <option value="Member">General Member</option>
                </select>
              </div>
            </div>

            {/* 4. Upload Organisation ID Card */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                Upload Organisation ID Card
              </label>

              <div className="border-2 border-dashed border-teal-300 rounded-2xl p-4 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                    <FileBadge className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      {idCardFileName ? idCardFileName : idCardPreview ? "ID Document on record" : "Upload Employee / Student ID Card"}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Supports PNG, JPG, JPEG, or PDF (Max 5MB)
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Browse File</span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* ID Card Thumbnail Preview */}
              {idCardPreview && (
                <div className="p-3 bg-white border border-teal-200 rounded-xl flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <img
                      src={idCardPreview}
                      alt="ID Preview"
                      className="w-12 h-8 object-cover rounded-lg border border-slate-200 shadow-2xs"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block">ID Document Attached</span>
                      <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Ready to link with profile
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="text-xs text-rose-600 hover:underline font-bold cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-teal-100">
            <button
              type="button"
              onClick={handleCloseForm}
              disabled={isSubmitting}
              className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !employeeId.trim()}
              className="px-5 py-2 bg-teal-800 hover:bg-teal-900 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Linking Affiliation...</span>
                </>
              ) : (
                <>
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Save &amp; Link Affiliation</span>
                </>
              )}
            </button>
          </div>
        </form>
      ) : organizationAffiliation ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Org Name */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Empanelled Organisation
            </span>
            <div className="font-extrabold text-slate-900 text-sm">
              {organizationAffiliation.organizationName || "Affiliated Organisation"}
            </div>
            {organizationAffiliation.organizationCode ? (
              <div className="text-[11px] font-mono font-bold text-teal-800">
                {organizationAffiliation.organizationCode}
              </div>
            ) : null}
          </div>

          {/* Member ID */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Employee / Student ID
            </span>
            <div className="font-mono font-black text-slate-900 text-base">
              {organizationAffiliation.memberId || "N/A"}
            </div>
            <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
              {organizationAffiliation.category || "Member"}
            </span>
          </div>

          {/* Department */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Department / Division
            </span>
            <div className="font-bold text-slate-800 text-sm">
              {organizationAffiliation.department || "General"}
            </div>
            <span className="text-[10px] text-slate-500 block">
              Occupational Health Registry
            </span>
          </div>

          {/* Uploaded ID Card Card */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/90 flex flex-col justify-between gap-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Organisation ID Card
              </span>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                  <FileBadge className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-800 truncate">
                    ID Document
                  </div>
                  <span className="text-[10px] text-emerald-700 font-bold block">
                    Verified &bull; On Record
                  </span>
                </div>
              </div>
            </div>

            {organizationAffiliation.idCardUrl ? (
              <button
                type="button"
                onClick={onViewIdCard}
                className="w-full py-1.5 px-2 bg-white hover:bg-teal-50 text-teal-800 border border-slate-200 hover:border-teal-300 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-teal-600" />
                <span>View ID Card</span>
              </button>
            ) : (
              <div className="py-1.5 px-2 bg-slate-100 text-slate-400 rounded-xl text-[11px] font-medium text-center">
                No Document Uploaded
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-6 bg-slate-50/80 rounded-2xl border border-slate-200 text-center space-y-3">
          <Building2 className="w-8 h-8 text-slate-400 mx-auto" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-700">
              No organisation or corporate affiliation currently linked to your profile.
            </h4>
            <p className="text-[11px] text-slate-500 max-w-md mx-auto">
              If you are an employee, student, or member of an empanelled institution, you can affiliate to access subsidized corporate or campus health benefits.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenForm}
            className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl transition-all shadow-xs inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Affiliate to Organisation</span>
          </button>
        </div>
      )}
    </div>
  );
}
