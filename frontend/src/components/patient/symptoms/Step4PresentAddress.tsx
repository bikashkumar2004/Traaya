"use client";

import React from "react";
import {
  ChevronDown,
  MapPin,
  ArrowLeft,
  ArrowRight,
  FileText,
  AlertTriangle,
} from "lucide-react";
import {
  getIndiaStates,
  getDistrictsForState,
  getBlocksForDistrict,
} from "@/lib/india-locations";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface Facility {
  id: string;
  facility_name: string;
  block?: string;
  district?: string;
  address_line1?: string;
  department?: string;
}

export interface Step4PresentAddressProps {
  presentState: string;
  presentDistrict: string;
  presentBlock: string;
  handleStateChange: (state: string) => void;
  handleDistrictChange: (district: string) => void;
  handleBlockChange: (block: string) => void;
  selectedFacilityId: string;
  setSelectedFacilityId: (id: string) => void;
  selectedFacilityName: string;
  setSelectedFacilityName: (name: string) => void;
  addressFilteredFacilities: Facility[];
  facilitiesList: Facility[];
  onBack: () => void;
  onContinue: () => void;
  onSaveDraft: () => void;
  isSavingDraft: boolean;
  isSubmitting: boolean;
}

export function Step4PresentAddress({
  presentState,
  presentDistrict,
  presentBlock,
  handleStateChange,
  handleDistrictChange,
  handleBlockChange,
  selectedFacilityId,
  setSelectedFacilityId,
  selectedFacilityName,
  setSelectedFacilityName,
  addressFilteredFacilities,
  facilitiesList,
  onBack,
  onContinue,
  onSaveDraft,
  isSavingDraft,
  isSubmitting,
}: Step4PresentAddressProps) {
  const availableBlocks =
    presentState && presentDistrict ? getBlocksForDistrict(presentState, presentDistrict) : [];
  const isAddressComplete = Boolean(
    presentState &&
    presentDistrict &&
    (availableBlocks.length === 0 || presentBlock) &&
    selectedFacilityId
  );

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-6 text-slate-900">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
            Present Address
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Choose where you are staying now to connect you to your nearest clinic or hospital.
          </p>
        </div>
      </div>

      <div className="border border-slate-200 rounded-2xl p-5 sm:p-6 bg-slate-50/70 space-y-4 text-xs">
        {/* Dropdown 1: Present State */}
        <div className="space-y-1.5">
          <label className="text-slate-800 font-bold block">
            Present State *
          </label>
          <Select value={presentState} onValueChange={(val) => handleStateChange(val)}>
            <SelectTrigger className="w-full h-11 bg-white border-slate-200 rounded-xl text-slate-800 font-bold text-xs sm:text-sm shadow-2xs">
              <SelectValue placeholder="-- Select State --" />
            </SelectTrigger>
            <SelectContent className="max-h-72 rounded-2xl border-slate-200 shadow-xl">
              <SelectGroup>
                <SelectLabel>Indian States &amp; UTs</SelectLabel>
                {getIndiaStates().map((st) => (
                  <SelectItem key={st} value={st} className="py-2 text-xs font-semibold cursor-pointer">
                    {st}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {/* Dropdown 2: Present District */}
        <div className="space-y-1.5">
          <label className="text-slate-800 font-bold block">
            Present District *
          </label>
          <Select
            value={presentDistrict}
            onValueChange={(val) => handleDistrictChange(val)}
            disabled={!presentState}
          >
            <SelectTrigger className="w-full h-11 bg-white border-slate-200 rounded-xl text-slate-800 font-bold text-xs sm:text-sm shadow-2xs disabled:bg-slate-100 disabled:text-slate-400">
              <SelectValue
                placeholder={presentState ? "-- Select District --" : "-- Select State First --"}
              />
            </SelectTrigger>
            <SelectContent className="max-h-72 rounded-2xl border-slate-200 shadow-xl">
              <SelectGroup>
                <SelectLabel>Districts in {presentState || "State"}</SelectLabel>
                {presentState &&
                  getDistrictsForState(presentState).map((dist) => (
                    <SelectItem key={dist} value={dist} className="py-2 text-xs font-semibold cursor-pointer">
                      {dist}
                    </SelectItem>
                  ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {/* Dropdown 3: Present Block */}
        <div className="space-y-1.5">
          <label className="text-slate-800 font-bold block">
            Present Block / Sub-District *
          </label>
          <Select
            value={presentBlock}
            onValueChange={(val) => handleBlockChange(val)}
            disabled={!presentDistrict}
          >
            <SelectTrigger className="w-full h-11 bg-white border-slate-200 rounded-xl text-slate-800 font-bold text-xs sm:text-sm shadow-2xs disabled:bg-slate-100 disabled:text-slate-400">
              <SelectValue
                placeholder={
                  presentDistrict
                    ? "-- Select Block / Sub-District --"
                    : "-- Select District First --"
                }
              />
            </SelectTrigger>
            <SelectContent className="max-h-72 rounded-2xl border-slate-200 shadow-xl">
              <SelectGroup>
                <SelectLabel>Blocks in {presentDistrict || "District"}</SelectLabel>
                {presentDistrict &&
                  getBlocksForDistrict(presentState, presentDistrict).map((blk) => (
                    <SelectItem key={blk} value={blk} className="py-2 text-xs font-semibold cursor-pointer">
                      {blk}
                    </SelectItem>
                  ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {/* Facility Selection */}
        <div className="space-y-1.5 pt-1">
          <label className="text-slate-800 font-bold block">
            Choose Nearest Clinic or Hospital *
          </label>
          <Select
            value={selectedFacilityId}
            onValueChange={(id) => {
              setSelectedFacilityId(id);
              const fac = addressFilteredFacilities.find((f) => f.id === id);
              setSelectedFacilityName(fac ? fac.facility_name : "");
            }}
            disabled={!presentState || !presentDistrict}
          >
            <SelectTrigger className="w-full h-11 bg-white border-slate-200 rounded-xl text-slate-800 font-bold text-xs sm:text-sm shadow-2xs disabled:bg-slate-100 disabled:text-slate-400">
              <SelectValue
                placeholder={
                  !presentState || !presentDistrict
                    ? "-- Please Select State & District First --"
                    : addressFilteredFacilities.length === 0
                    ? `No clinics found under ${presentBlock ? `${presentBlock}, ` : ""}${presentDistrict}`
                    : "-- Select Nearest Clinic or Hospital --"
                }
              />
            </SelectTrigger>
            <SelectContent className="max-h-72 rounded-2xl border-slate-200 shadow-xl">
              <SelectGroup>
                <SelectLabel>Registered Healthcare Facilities</SelectLabel>
                {addressFilteredFacilities.map((fac) => (
                  <SelectItem key={fac.id} value={fac.id} className="py-2 text-xs font-semibold cursor-pointer">
                    {fac.facility_name} ({fac.block || fac.district || "Health Centre"})
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <p className="text-[11px] text-slate-500">
            Showing only health facilities registered under your selected address.
          </p>
        </div>

        {/* Designated Facility routing preview */}
        {(() => {
          const selFac = facilitiesList.find((f) => f.id === selectedFacilityId);
          if (!selectedFacilityId || !selFac) {
            return (
              <div className="p-4 bg-slate-100/70 rounded-xl border border-dashed border-slate-300 text-xs text-slate-500 flex items-center gap-3">
                <MapPin className="w-5 h-5 text-slate-400 shrink-0" />
                <div>
                  <span className="text-slate-700 block text-[11px] font-bold">
                    Designated Clinic or Hospital:
                  </span>
                  <span className="text-slate-500">
                    Please select your State, District, Block, and Clinic above.
                  </span>
                </div>
              </div>
            );
          }

          return (
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-start gap-3">
              <MapPin className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div className="space-y-0.5 flex-1">
                <span className="text-slate-600 block text-[11px] font-semibold">
                  Assigned Clinic or Hospital:
                </span>
                <strong className="text-slate-900 text-xs sm:text-sm block font-bold">
                  {selectedFacilityName || selFac.facility_name}
                </strong>
                <p className="text-[11px] text-slate-600">
                  {selFac.address_line1 || (presentBlock ? `${presentBlock}, ${presentDistrict}, ${presentState}` : `${presentDistrict || ""}, ${presentState || ""}`)} &bull;{" "}
                  <span className="font-semibold text-emerald-800">
                    {selFac.department || "Emergency & Primary Triage"}
                  </span>
                </p>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Address completeness warning */}
      {!isAddressComplete && (
        <div className="flex items-center gap-2.5 p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs font-bold">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Please choose your State, District, Block, and nearest Clinic or Hospital to continue.
          </span>
        </div>
      )}

      {/* Navigation */}
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
              if (isAddressComplete) {
                onContinue();
              }
            }}
            disabled={!isAddressComplete}
            className={`px-6 py-2.5 font-bold text-xs sm:text-sm rounded-xl flex items-center gap-2 shadow-sm transition-all ${
              isAddressComplete
                ? "bg-teal-800 hover:bg-teal-900 text-white cursor-pointer"
                : "bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed opacity-60"
            }`}
          >
            <span>Review Before Submission</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
