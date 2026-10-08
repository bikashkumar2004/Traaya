"use client";

import React from "react";
import { UploadCloud, Camera, FolderOpen, Lock } from "lucide-react";

interface UploadDropzoneProps {
  onFileSelect: (file: File) => void;
  onOpenFileBrowser: () => void;
  onLoadSample?: (testType: string, fileName: string) => void;
}

export function UploadDropzone({
  onFileSelect,
  onOpenFileBrowser,
  onLoadSample,
}: UploadDropzoneProps) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files?.[0];
          if (file) onFileSelect(file);
        }}
        className="border-2 border-dashed border-teal-300 bg-teal-50/20 hover:bg-teal-50/40 rounded-2xl p-7 sm:p-9 text-center space-y-4 transition-colors"
      >
        <div className="w-14 h-14 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center mx-auto shadow-xs">
          <UploadCloud className="w-7 h-7 text-teal-700" />
        </div>

        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900">
            Drag &amp; drop your medical report here, or{" "}
            <button
              type="button"
              onClick={onOpenFileBrowser}
              className="text-teal-800 underline font-bold cursor-pointer hover:text-teal-900"
            >
              Browse Files
            </button>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Accepted: PDF, JPG, PNG photos from your phone or lab. Automatically stored in Supabase Storage.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-1 flex-wrap">
          <button
            type="button"
            onClick={onOpenFileBrowser}
            className="px-4 py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>Take Photo of Report</span>
          </button>
          <button
            type="button"
            onClick={onOpenFileBrowser}
            className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <FolderOpen className="w-4 h-4 text-teal-700" />
            <span>Choose File from Device</span>
          </button>
        </div>

        <div className="pt-1 text-[11px] text-slate-400 flex items-center justify-center gap-2 flex-wrap">
          <Lock className="w-3 h-3 text-teal-700" />
          <span>256-bit AES Encryption</span>
          <span>&bull;</span>
          <span>Supabase Cloud Storage</span>
          <span>&bull;</span>
          <span>Private &amp; Confidential</span>
        </div>
      </div>
    </div>
  );
}
