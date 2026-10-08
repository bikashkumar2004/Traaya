"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth, UserRole, INDIAN_LANGUAGES } from "@/lib/auth-context";
import { 
  Activity, 
  ChevronDown,
  Globe,
  Users,
  Stethoscope
} from "lucide-react";

export function Header() {
  const pathname = usePathname();
  const { user, role, language, setLanguage } = useAuth();
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [langSearch, setLangSearch] = useState("");

  const filteredLanguages = INDIAN_LANGUAGES.filter(
    (l) =>
      l.name.toLowerCase().includes(langSearch.toLowerCase()) ||
      l.nativeName.toLowerCase().includes(langSearch.toLowerCase()) ||
      l.code.toLowerCase().includes(langSearch.toLowerCase())
  );

  const isLandingPage = pathname === "/";
  const isAuthOrRegister =
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

  if (isAuthOrRegister) return null;

  const currentPortalLinks: Record<UserRole, Array<{ href: string; label: string }>> = {
    patient: [
      { href: "/citizen", label: "Dashboard" },
      { href: "/citizen/symptoms", label: "Report Symptoms" },
      { href: "/citizen/upload", label: "Upload Reports" },
      { href: "/citizen/timeline", label: "Health Timeline" },
      { href: "/citizen/profile", label: "My Profile" },
    ],
    nurse: [
      { href: "/nurse", label: "Triage Queue" },
      { href: "/nurse/intake", label: "Intake Station" },
      { href: "/nurse/ocr", label: "OCR Scanner" },
      { href: "/nurse/escalations", label: "Red Flags" },
    ],
    doctor: [
      { href: "/doctor", label: "Review Queue" },
      { href: "/doctor/decision", label: "Decision Station" },
      { href: "/doctor/history", label: "Longitudinal EHR" },
      { href: "/doctor/analytics", label: "Analytics" },
      { href: "/doctor/audit", label: "Audit Log" },
    ],
    admin: [
      { href: "/admin", label: "Admin Console" },
      { href: "/doctor/analytics", label: "Analytics" },
      { href: "/doctor/audit", label: "Compliance Log" },
    ],
    organization: [
      { href: "/organization", label: "Health Dashboard" },
      { href: "/organization#telemetry", label: "Student & Employee Telemetry" },
    ],
    healthcamp: [
      { href: "/healthcamp", label: "Camp Station" },
      { href: "/healthcamp#intake", label: "Rapid Intake" },
    ],
    facility: [
      { href: "/medical", label: "Dispensary & Pharmacy" },
      { href: "/medical#inventory", label: "Drug Inventory" },
    ],
    medical: [
      { href: "/medical", label: "Dispensary & Pharmacy" },
      { href: "/medical#inventory", label: "Drug Inventory" },
    ],
  };

  const portalNav = currentPortalLinks[role] || currentPortalLinks.patient;
  const currentLangObj = INDIAN_LANGUAGES.find((l) => l.code === language) || INDIAN_LANGUAGES[0];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-teal-700 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
              <Activity className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-lg tracking-tight text-slate-900">
              Triage<span className="text-teal-700">Assist</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-600">
            {isLandingPage ? (
              <>
                <Link href="/" className="text-teal-800 hover:text-teal-900">Platform</Link>
                <Link href="/citizen" className="hover:text-teal-800">For Citizens</Link>
                <Link href="/nurse" className="hover:text-teal-800">For Health Workers</Link>
                <Link href="/doctor" className="hover:text-teal-800">For Doctors</Link>
                <Link href="/doctor/audit" className="hover:text-teal-800">Safety &amp; Privacy</Link>
              </>
            ) : (
              portalNav.map((item) => (
                <Link
                  key={`${item.href}-${item.label}`}
                  href={item.href}
                  className={`transition-colors ${
                    pathname === item.href ? "text-teal-800 font-bold" : "hover:text-teal-800"
                  }`}
                >
                  {item.label}
                </Link>
              ))
            )}
          </nav>

          {/* Right Action buttons */}
          <div className="flex items-center gap-3">
            {/* All Indian Regional Languages Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <Globe className="w-3.5 h-3.5 text-teal-700" />
                <span>{currentLangObj.nativeName}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {langDropdownOpen && (
                <div 
                  className="absolute right-0 mt-1 w-60 max-h-80 overflow-hidden flex flex-col bg-white rounded-xl shadow-xl border border-slate-200 z-50 text-xs"
                  onMouseLeave={() => setLangDropdownOpen(false)}
                >
                  <div className="p-2 border-b border-slate-100 bg-slate-50/60">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-teal-800 mb-1.5">
                      <span>23 Languages</span>
                      <span className="text-[9px] bg-teal-100 text-teal-900 px-1.5 py-0.5 rounded font-mono">Sarvam AI</span>
                    </div>
                    <input
                      type="text"
                      placeholder="Search language..."
                      value={langSearch}
                      onChange={(e) => setLangSearch(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-teal-700 focus:border-teal-700"
                    />
                  </div>
                  <div className="overflow-y-auto max-h-56 divide-y divide-slate-100 py-1">
                    {filteredLanguages.map((l) => (
                      <button
                        key={l.code}
                        type="button"
                        onClick={() => {
                          setLanguage(l.code);
                          setLangDropdownOpen(false);
                          setLangSearch("");
                        }}
                        className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-teal-50 transition-colors ${
                          language === l.code ? "font-bold text-teal-800 bg-teal-50/70" : "text-slate-700"
                        }`}
                      >
                        <span className="font-medium">{l.nativeName}</span>
                        <span className="text-[11px] text-slate-400 font-normal">{l.name}</span>
                      </button>
                    ))}
                    {filteredLanguages.length === 0 && (
                      <div className="px-3 py-3 text-center text-xs text-slate-400">
                        No language found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 2 Distinct Setup Buttons for Landing Page: Individual & Org vs Health Workers */}
            <Link
              href="/login?setup=individual"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-teal-900 px-3 py-2 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-slate-50 transition-all cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-teal-700" />
              <span>Individual &amp; Org</span>
            </Link>

            <Link
              href="/login?setup=health_worker"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              <Stethoscope className="w-3.5 h-3.5 text-teal-200" />
              <span>Health Workers</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Subnav row for internal portal navigation when inside patient/nurse/doctor routes */}
      {!isLandingPage && (
        <div className="border-t border-slate-100 bg-slate-50/90 px-4 py-1.5 overflow-x-auto flex gap-1 scrollbar-none max-w-7xl mx-auto">
          {portalNav.map((item) => (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              className={`px-3 py-1 rounded-md text-xs whitespace-nowrap font-medium transition-colors ${
                pathname === item.href
                  ? "bg-teal-800 text-white font-semibold"
                  : "text-slate-600 hover:bg-slate-200"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
