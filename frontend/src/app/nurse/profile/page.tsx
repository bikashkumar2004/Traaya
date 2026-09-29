"use client";

import React, { Suspense } from "react";
import { NurseShell } from "@/components/nurse/NurseShell";
import { NurseProfileView } from "@/components/nurse/NurseProfileView";
import { useRouter } from "next/navigation";

export default function NurseProfilePage() {
  const router = useRouter();

  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading Profile...</div>}>
      <NurseShell
        activeTab="profile"
        onTabChange={(tab) => {
          if (tab === "profile") return;
          router.push(`/nurse?tab=${tab}`);
        }}
      >
        <NurseProfileView />
      </NurseShell>
    </Suspense>
  );
}
