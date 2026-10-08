"use client";

import React from "react";
import { RefreshCw } from "lucide-react";

export function UploadScanningState() {
  return (
    <div className="bg-white rounded-3xl border border-teal-200/90 p-10 shadow-xs text-center space-y-4 animate-in fade-in duration-300">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shadow-2xs">
        <RefreshCw className="w-7 h-7 text-teal-700 animate-spin" />
      </div>
      <div className="space-y-1.5 max-w-md mx-auto">
        <h3 className="text-base sm:text-lg font-black text-slate-900">
          Saving to Cloud &amp; Analyzing Report...
        </h3>
        <p className="text-xs sm:text-sm text-slate-500">
          Uploading file to Supabase storage, scanning test biomarkers, and writing a plain-language summary for you.
        </p>
      </div>
      <div className="w-64 mx-auto h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-teal-700 rounded-full animate-pulse" style={{ width: "85%" }} />
      </div>
    </div>
  );
}
