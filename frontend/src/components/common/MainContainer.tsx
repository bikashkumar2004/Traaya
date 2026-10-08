"use client";

import React from "react";
import { usePathname } from "next/navigation";

export function MainContainer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isCustomLayout =
    pathname === "/login" ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/citizen") ||
    pathname.startsWith("/patient") ||
    pathname.startsWith("/nurse") ||
    pathname.startsWith("/doctor") ||
    pathname.startsWith("/organization") ||
    pathname.startsWith("/healthcamp") ||
    pathname.startsWith("/medical") ||
    pathname.startsWith("/facility");

  if (isCustomLayout) {
    return <main className="flex-1 w-full">{children}</main>;
  }

  return (
    <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {children}
    </main>
  );
}
