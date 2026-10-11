"use client";

import React, { Suspense } from "react";
import { DoctorShell } from "@/components/doctor/DoctorShell";
import { DoctorProfileView } from "@/components/doctor/DoctorProfileView";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

export default function DoctorProfilePage() {
  const router = useRouter();

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F3F9F7] flex items-center justify-center">
          <div className="flex items-center gap-2 text-teal-800 font-bold text-sm">
            <RefreshCw className="w-5 h-5 animate-spin text-teal-700" />
            <span>Loading Doctor Profile...</span>
          </div>
        </div>
      }
    >
      <DoctorShell
        activeTab="profile"
        onTabChange={(tab) => {
          if (tab === "profile") return;
          router.push(`/doctor?tab=${tab}`);
        }}
      >
        <DoctorProfileView />
      </DoctorShell>
    </Suspense>
  );
}
