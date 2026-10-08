"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth, INDIAN_LANGUAGES } from "@/lib/auth-context";
import {
  LayoutDashboard,
  ClipboardList,
  Calendar,
  UploadCloud,
  Bell,
  Lock,
  Users,
  PhoneCall,
  ShieldCheck,
  Building2,
  Clock,
  AlertTriangle,
  Flame,
  Check,
  Menu,
  X,
  Globe,
  ChevronDown,
  Activity,
  LogOut
} from "lucide-react";

interface PatientShellProps {
  children: React.ReactNode;
}

export function PatientShell({ children }: PatientShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, language, setLanguage, signOut } = useAuth();
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [langSearch, setLangSearch] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [ashaModalOpen, setAshaModalOpen] = useState(false);

  const filteredLanguages = INDIAN_LANGUAGES.filter(
    (l) =>
      l.name.toLowerCase().includes(langSearch.toLowerCase()) ||
      l.nativeName.toLowerCase().includes(langSearch.toLowerCase()) ||
      l.code.toLowerCase().includes(langSearch.toLowerCase())
  );

  const actualFullName = user?.fullName || "";
  const actualPatientId = user?.patientUhid || user?.userId || "";

  const getInitials = (name: string) => {
    if (!name) return "PT";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const currentLangObj = INDIAN_LANGUAGES.find((l) => l.code === language) || INDIAN_LANGUAGES[0];

  const navItems = [
    {
      href: "/citizen",
      label: "Dashboard",
      icon: LayoutDashboard,
      exact: true
    },
    {
      href: "/citizen/symptoms",
      label: "Report Symptoms",
      icon: ClipboardList
    },
    {
      href: "/citizen/timeline",
      label: "My Timeline & Visits",
      icon: Calendar
    },
    {
      href: "/citizen/upload",
      label: "Upload Reports",
      icon: UploadCloud
    },
    {
      href: "/citizen/reminders",
      label: "Reminders & Follow-ups",
      icon: Bell
    },
    {
      href: "/citizen/profile",
      label: "My Profile",
      icon: Users
    }
  ];

  return (
    <div className="flex min-h-screen bg-[#f4f7fb] text-slate-800 antialiased font-sans">
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* LEFT SIDEBAR (Light Soft Blue #EAF1FF) - Fixed Position */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 h-screen bg-[#EAF1FF] text-slate-800 flex flex-col justify-between border-r border-blue-200/70 transition-transform duration-200 ${
          mobileMenuOpen ? "translate-x-0 shadow-2xl z-50" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Top Brand with Landing Page Logo */}
          <div className="p-4 border-b border-blue-200/60 flex items-center justify-between shrink-0">
            <Link href="/citizen" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-teal-700 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform shrink-0">
                <Activity className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-extrabold text-base tracking-tight text-slate-900 leading-tight">
                  Triage<span className="text-teal-700">Assist</span>
                </span>
                <span className="text-[10px] font-semibold text-teal-800 tracking-wide leading-none mt-1">
                  Citizen Health Portal
                </span>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden text-slate-500 hover:text-slate-800 p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(item.href.split("#")[0] + "/");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? "bg-teal-700 text-white shadow-sm font-bold"
                      : "text-slate-700 hover:text-teal-900 hover:bg-white/80"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-teal-700/80"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Bottom Actions in Sidebar */}
          <div className="p-3 border-t border-blue-200/70 bg-[#dbe8fd]/50 space-y-2 shrink-0">
            <button
              type="button"
              onClick={() => setEmergencyModalOpen(true)}
              className="w-full bg-[#dc2626] hover:bg-red-700 text-white font-bold text-xs py-2.5 px-3 rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Flame className="w-4 h-4 fill-white animate-pulse" />
              <span>SOS Emergency 108</span>
            </button>

            <button
              type="button"
              onClick={() => setAshaModalOpen(true)}
              className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs py-2 px-3 rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Dial ASHA Worker</span>
            </button>

            <div className="pt-2 text-[10px] text-slate-600 border-t border-blue-200/60 flex items-start gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-teal-900 block">Human-in-the-Loop</span>
                <span className="text-[9px] text-slate-500 block leading-tight">
                  Assistive system only. All suggestions require clinical verification.
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* RIGHT MAIN WORKSPACE (Offset by fixed 64 (16rem) sidebar on desktop) */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* TOP BAR - Sticky docked */}
        <header className="h-16 bg-white border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-xs sticky top-0 z-30">
          {/* Mobile hamburger menu toggle & brand */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="lg:hidden flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-teal-700 flex items-center justify-center text-white shadow-xs shrink-0">
                <Activity className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-sm tracking-tight text-slate-900 leading-tight">
                  Triage<span className="text-teal-700">Assist</span>
                </span>
                <span className="text-[9px] font-semibold text-teal-800 leading-none mt-0.5">
                  Citizen Health Portal
                </span>
              </div>
            </div>
          </div>

          {/* Right actions - ONLY language dropdown, notification bell, profile icon with actual full name */}
          <div className="flex items-center gap-2.5 sm:gap-4 ml-auto">
            {/* Language dropdown (topdown view like landing page) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
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
                        className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-teal-50 transition-colors cursor-pointer ${
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

            {/* Notifications Bell */}
            <button
              type="button"
              className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
            </button>

            {/* Profile Icon with actual registered full name */}
            <Link
              href="/citizen/profile"
              className="flex items-center gap-2.5 p-1 pl-1.5 pr-3 rounded-xl hover:bg-slate-100 transition-colors border border-slate-200/80 bg-slate-50/60 group"
              title="View Profile & Settings"
            >
              <div className="w-8 h-8 rounded-full bg-teal-800 text-white flex items-center justify-center font-bold text-xs shadow-xs ring-2 ring-teal-600/20 shrink-0 group-hover:scale-105 transition-transform">
                {actualFullName ? (
                  getInitials(actualFullName)
                ) : (
                  <span className="inline-block w-4 h-4 bg-teal-600/60 rounded-full animate-pulse" />
                )}
              </div>
              <div className="text-left hidden sm:block">
                {actualFullName ? (
                  <span className="text-xs font-bold text-slate-900 block leading-tight truncate max-w-[150px]">
                    {actualFullName}
                  </span>
                ) : (
                  <div className="h-3 w-20 bg-slate-200 rounded animate-pulse my-0.5" />
                )}
                {actualPatientId ? (
                  <span className="text-[10px] text-teal-700 font-semibold block leading-none font-mono">
                    {actualPatientId}
                  </span>
                ) : (
                  <div className="h-2.5 w-14 bg-teal-100 rounded animate-pulse mt-0.5" />
                )}
              </div>
            </Link>

            {/* Logout Button */}
            <button
              type="button"
              onClick={async () => {
                await signOut();
                router.push("/login");
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200/80 bg-rose-50/80 hover:bg-rose-100 text-rose-700 hover:text-rose-800 text-xs font-semibold transition-all cursor-pointer shadow-xs hover:scale-[1.02] shrink-0 active:scale-95"
              title="Sign Out / Logout"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-600" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          {children}
        </main>

        {/* COMPLIANCE & SAFETY FOOTER */}
        <footer className="bg-white border-t border-slate-200 py-3 px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2 shrink-0">
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap text-slate-600 font-medium">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              Digital Health Ready
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-teal-600" />
              DPDP Act 2023 Compliant
            </span>
            <span>&bull;</span>
            <span>ISO 27001 Certified</span>
          </div>

          <div className="text-right text-[10px] text-slate-400 max-w-xl text-center sm:text-right">
            Triage assistive tool only. Not a definitive clinical diagnosis. Final triage decision rests with the attending healthcare professional.
          </div>
        </footer>
      </div>

      {/* EMERGENCY 108 DIALOG */}
      {emergencyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-200 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Flame className="w-8 h-8 fill-rose-600 animate-bounce" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              National Emergency Ambulance Service (108)
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              If the patient has acute chest pain radiating to arm/jaw, severe difficulty breathing, sudden unconsciousness, or profuse bleeding, contact 108 ALS immediately.
            </p>
            <div className="bg-rose-50 p-3 rounded-xl border border-rose-200 text-rose-800 text-xs font-mono font-bold">
              Dispatch Hotline: 108 / 102 &bull; Toll Free 24x7
            </div>
            <div className="flex gap-2">
              <a
                href="tel:108"
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs text-center"
              >
                Dial 108 Now
              </a>
              <button
                type="button"
                onClick={() => setEmergencyModalOpen(false)}
                className="px-4 py-2.5 border border-slate-300 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ASHA WORKER MODAL */}
      {ashaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-teal-200 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center mx-auto">
              <PhoneCall className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Direct ASHA Worker Connection
            </h3>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-left space-y-1 text-xs">
              <div className="font-bold text-slate-900">Sunita Didi (ASHA Worker)</div>
              <div className="text-slate-500">Village Rampur &bull; Sector 3</div>
              <div className="text-teal-700 font-mono font-bold">+91 94150 82160</div>
            </div>
            <div className="flex gap-2">
              <a
                href="tel:+919415082160"
                className="flex-1 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-xs text-center"
              >
                Call Sunita Didi
              </a>
              <button
                type="button"
                onClick={() => setAshaModalOpen(false)}
                className="px-4 py-2.5 border border-slate-300 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
