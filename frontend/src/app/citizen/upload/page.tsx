"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  StoredReport,
  UploadDropzone,
  UploadScanningState,
  UploadReportDetails,
  UploadReportsHistory,
} from "@/components/patient/upload";

export default function PatientUploadPage() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [activeReport, setActiveReport] = useState<StoredReport | null>(null);
  const [reportsHistory, setReportsHistory] = useState<StoredReport[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(true);

  // Fetch reports on mount
  const fetchReports = async () => {
    try {
      setIsLoadingHistory(true);
      const res = await fetch("/api/patient/reports");
      if (res.ok) {
        const json = await res.json();
        if (json.reports) {
          setReportsHistory(json.reports);
        }
      }
    } catch (e) {
      console.error("Failed to load reports history:", e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Upload handler via Next.js API (stores in Supabase storage & DB)
  const processUploadedFile = async (file: File) => {
    setIsScanning(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("file_name", file.name);
      formData.append("patient_id", user?.id || "");
      formData.append("report_type", file.name.replace(/\.[^/.]+$/, ""));

      const res = await fetch("/api/patient/reports", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          const newReport: StoredReport = {
            id: json.data.id,
            patient_id: json.data.patient_id,
            report_type: json.data.report_type,
            file_url: json.data.file_url,
            file_type: json.data.file_type,
            report_summary: json.data.report_summary,
            created_at: json.data.created_at || new Date().toISOString(),
          };
          setActiveReport(newReport);
          setReportsHistory((prev) => [newReport, ...prev.filter((r) => r.id !== newReport.id)]);
        }
      }
    } catch (e) {
      console.error("Upload error:", e);
    } finally {
      setIsScanning(false);
    }
  };

  // Sample report loader for quick testing
  const handleLoadSample = async (testType: string, fileName: string) => {
    setIsScanning(true);

    try {
      const formData = new FormData();
      formData.append("file_name", fileName);
      formData.append("report_type", testType);
      formData.append("patient_id", user?.id || "");

      const res = await fetch("/api/patient/reports", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          const newReport: StoredReport = {
            id: json.data.id,
            patient_id: json.data.patient_id,
            report_type: json.data.report_type,
            file_url: json.data.file_url,
            file_type: json.data.file_type,
            report_summary: json.data.report_summary,
            created_at: json.data.created_at || new Date().toISOString(),
          };
          setActiveReport(newReport);
          setReportsHistory((prev) => [newReport, ...prev.filter((r) => r.id !== newReport.id)]);
        }
      }
    } catch (e) {
      console.error("Sample report error:", e);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12" id="locker">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) processUploadedFile(file);
        }}
      />

      {/* Header Banner */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Upload Reports &amp; View Simplified Summary
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
          Upload your blood tests, pathology slips, or diagnostic reports. Our AI reads the medical jargon and explains your results in clear, everyday words so you understand your health.
        </p>
      </div>

      {/* 1. Upload Dropzone Card */}
      <UploadDropzone
        onFileSelect={processUploadedFile}
        onOpenFileBrowser={() => fileInputRef.current?.click()}
        onLoadSample={handleLoadSample}
      />

      {/* 2. Scanning Animation State */}
      {isScanning && <UploadScanningState />}

      {/* 3. Active Report Analysis & Summary Section */}
      {!isScanning && activeReport && (
        <UploadReportDetails
          activeReport={activeReport}
          onDismiss={() => setActiveReport(null)}
        />
      )}

      {/* 4. Patient's Stored Reports & Lab History */}
      <UploadReportsHistory
        isLoadingHistory={isLoadingHistory}
        reportsHistory={reportsHistory}
        onRefresh={fetchReports}
        onSelectReport={(report) => {
          setActiveReport(report);
          if (typeof window !== "undefined") {
            window.scrollTo({ top: 200, behavior: "smooth" });
          }
        }}
      />
    </div>
  );
}
