"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { AlertTriangle } from "lucide-react";

export function DisclaimerBanner() {
  const pathname = usePathname();
  if (
    pathname === "/login" ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/patient") ||
    pathname.startsWith("/nurse") ||
    pathname.startsWith("/doctor") ||
    pathname.startsWith("/organization") ||
    pathname.startsWith("/healthcamp") ||
    pathname.startsWith("/medical")
  ) {
    return null;
  }

  return (
    <footer className="w-full bg-slate-100 border-t border-slate-200 py-2.5 px-4 text-center">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-[11px] font-medium tracking-wide uppercase text-slate-600">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        <span>
          Triage assistive tool only. Not a definitive clinical diagnosis. Final triage decision rests with the attending healthcare professional.
        </span>
      </div>
    </footer>
  );
}
