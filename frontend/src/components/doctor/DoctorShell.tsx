"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, INDIAN_LANGUAGES } from "@/lib/auth-context";
import {
  LayoutDashboard,
  ClipboardCheck,
  AlertTriangle,
  History,
  Building2,
  User,
  Search,
  Bell,
  Activity,
  Menu,
  X,
  Globe,
  ChevronDown,
  ShieldCheck,
  LogOut,
  Stethoscope,
  HeartPulse
} from "lucide-react";

export type DoctorNavTab =
  | "dashboard"
  | "queue"
  | "emergency"
  | "history"
  | "facility"
  | "profile";

interface DoctorShellProps {
  children: React.ReactNode;
  activeTab?: DoctorNavTab;
  onTabChange?: (tab: DoctorNavTab) => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  queueCount?: number;
  emergencyCount?: number;
  historyCount?: number;
}

export function DoctorShell({
  children,
  activeTab = "dashboard",
  onTabChange,
  searchQuery = "",
  onSearchChange,
  queueCount = 0,
  emergencyCount = 0,
  historyCount = 0,
}: DoctorShellProps) {
  const router = useRouter();
  const { user, language, setLanguage, signOut } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const currentLangObj =
    INDIAN_LANGUAGES.find((l) => l.code === language) || INDIAN_LANGUAGES[0];

  const navItems: Array<{
    id: DoctorNavTab;
    label: string;
    icon: React.ElementType;
    badge?: number;
    badgeClass?: string;
    isEmergency?: boolean;
  }> = [
    { 
      id: "dashboard", 
      label: "Dashboard", 
      icon: LayoutDashboard 
    },
    { 
      id: "queue", 
      label: "Review Queue", 
      icon: ClipboardCheck,
      badge: queueCount > 0 ? queueCount : undefined,
      badgeClass: "bg-teal-100 text-teal-800"
    },
    { 
      id: "emergency", 
      label: "Emergency Cases", 
      icon: AlertTriangle,
      badge: emergencyCount > 0 ? emergencyCount : undefined,
      badgeClass: "bg-rose-100 text-rose-800 font-black animate-pulse",
      isEmergency: true
    },
    { 
      id: "history", 
      label: "Review History", 
      icon: History,
      badge: historyCount > 0 ? historyCount : undefined,
      badgeClass: "bg-blue-100 text-blue-800"
    },
    { 
      id: "facility", 
      label: "Facility Availability", 
      icon: Building2 
    },
    { 
      id: "profile", 
      label: "My Profile", 
      icon: User 
    },
  ];

  const handleNavClick = (tabId: DoctorNavTab) => {
    setMobileSidebarOpen(false);
    if (onTabChange) {
      onTabChange(tabId);
    } else {
      router.push(`/doctor?tab=${tabId}`);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f4f7fb] text-slate-800 antialiased font-sans">
      {/* Mobile Drawer Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* LEFT SIDEBAR (Light Soft Blue #EAF1FF like patient & nurse page) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 h-screen bg-[#EAF1FF] text-slate-800 flex flex-col justify-between border-r border-blue-200/70 transition-transform duration-200 ${
          mobileSidebarOpen ? "translate-x-0 shadow-2xl z-50" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Top Brand */}
          <div className="p-4 border-b border-blue-200/60 flex items-center justify-between shrink-0">
            <Link href="/doctor" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-teal-700 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform shrink-0">
                <Activity className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-extrabold text-base tracking-tight text-slate-900 leading-tight">
                  Triage<span className="text-teal-700">Assist</span>
                </span>
                <span className="text-[10px] font-semibold text-teal-800 tracking-wide leading-none mt-1">
                  Doctor Command Station
                </span>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              className="lg:hidden text-slate-500 hover:text-slate-800 p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              // Special Emergency styling when highlighted
              let itemClass = "text-slate-700 hover:text-teal-900 hover:bg-white/80";
              let iconClass = "text-teal-700/80";
              
              if (item.isEmergency) {
                if (isActive) {
                  itemClass = "bg-rose-700 text-white shadow-sm font-bold";
                  iconClass = "text-white";
                } else {
                  itemClass = "text-rose-700 hover:text-rose-900 hover:bg-rose-50/80 font-bold";
                  iconClass = "text-rose-600";
                }
              } else if (isActive) {
                itemClass = "bg-teal-700 text-white shadow-sm font-bold";
                iconClass = "text-white";
              }

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs transition-all duration-150 w-full text-left cursor-pointer group ${itemClass}`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${iconClass}`} />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full shrink-0 ${
                        isActive
                          ? "bg-white text-slate-900"
                          : item.badgeClass || "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Bottom Actions in Sidebar (Patient & Nurse theme styling) */}
          <div className="p-3 border-t border-blue-200/70 bg-[#dbe8fd]/50 space-y-2 shrink-0">
            <div className="flex items-center gap-2.5 p-2 bg-white/80 rounded-xl border border-blue-200/60">
              <div className="w-8 h-8 rounded-lg bg-teal-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-900 truncate">
                  CHC Khandapada
                </div>
                <div className="text-[10px] text-teal-700 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Primary Health Node
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        {/* Top Navbar matching Nurse page navbar */}
        <header className="sticky top-0 z-40 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          {/* Left: Mobile Toggle & Station Subtitle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Hospital Context Breadcrumb / Station Badge */}
            <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-600">
              <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                CHC Khandapada
              </span>
              <span className="text-slate-300">&bull;</span>
              <span className="text-slate-500 font-medium">
                Doctor Command Station
              </span>
            </div>
          </div>

          {/* Center: Search Bar */}
          <div className="flex-1 max-w-md mx-2 sm:mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search cases, patient ID..."
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 rounded-xl text-xs text-slate-800 placeholder-slate-400 transition-all outline-hidden"
              />
            </div>
          </div>

          {/* Right Actions: Regional Language Dropdown, Notification Bell, Profile & Logout */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Indian Regional Language Dropdown */}
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
                  className="absolute right-0 mt-1 w-52 max-h-72 overflow-y-auto bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs divide-y divide-slate-100"
                  onMouseLeave={() => setLangDropdownOpen(false)}
                >
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Indian Regional Languages
                  </div>
                  <div className="py-1">
                    {INDIAN_LANGUAGES.map((l) => (
                      <button
                        key={l.code}
                        type="button"
                        onClick={() => {
                          setLanguage(l.code);
                          setLangDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-teal-50 transition-colors cursor-pointer ${
                          language === l.code
                            ? "font-bold text-teal-800 bg-teal-50/70"
                            : "text-slate-700"
                        }`}
                      >
                        <span className="font-medium">{l.nativeName}</span>
                        <span className="text-[11px] text-slate-400 font-normal">
                          {l.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Notifications Button with Red Badge Counter */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white font-bold text-[9px] rounded-full flex items-center justify-center shadow-xs">
                  {emergencyCount > 0 ? emergencyCount : 3}
                </span>
              </button>

              {notificationsOpen && (
                <div
                  className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 text-xs space-y-2 animate-in fade-in zoom-in-95 duration-150"
                  onMouseLeave={() => setNotificationsOpen(false)}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 font-bold text-slate-900">
                    <span>Clinical Alerts</span>
                    <span className="text-[10px] bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded font-bold">
                      {emergencyCount > 0 ? `${emergencyCount} Urgent` : "3 New"}
                    </span>
                  </div>
                  {emergencyCount > 0 && (
                    <div className="p-2 bg-rose-50/80 rounded-xl border border-rose-200 text-rose-900">
                      <div className="font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        <span>{emergencyCount} Red-Priority Critical Cases</span>
                      </div>
                      <div className="text-[11px] text-rose-700 mt-0.5">
                        Immediate physician order & ICU triage required
                      </div>
                    </div>
                  )}
                  <div className="p-2 bg-amber-50/70 rounded-xl border border-amber-200/70 text-slate-800">
                    <div className="font-bold text-amber-900">
                      Case #LS1024 Forwarded by Nurse
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5">
                      High Priority fever with body pain reported 10m ago
                    </div>
                  </div>
                  <div className="p-2 bg-teal-50/70 rounded-xl border border-teal-200/70 text-slate-800">
                    <div className="font-bold text-teal-900">
                      Doctor On Call Active
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5">
                      Dr. Kavita Verma signed in to CHC Khandapada
                    </div>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl border border-slate-200 text-slate-800">
                    <div className="font-bold text-slate-900">
                      Lab & Vitals Sync Completed
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5">
                      CBC & SpO2 telemetry verified for Emergency Bed 02
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Pill: Click navigates to Profile tab */}
            <button
              type="button"
              onClick={() => handleNavClick("profile")}
              className={`flex items-center gap-2.5 p-1 pl-1.5 pr-2.5 rounded-xl border transition-all cursor-pointer ${
                activeTab === "profile"
                  ? "bg-teal-50 border-teal-300 ring-2 ring-teal-100"
                  : "bg-white border-slate-200 hover:bg-slate-50"
              }`}
              title="View Doctor Profile & Credentials"
            >
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-teal-800 text-white font-bold flex items-center justify-center text-xs shadow-xs ring-2 ring-white">
                  {user?.fullName
                    ? user.fullName
                        .replace(/^Dr\.\s*/i, "")
                        .split(" ")
                        .filter(Boolean)
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()
                    : "DR"}
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
              </div>
              <div className="hidden sm:block text-left leading-tight">
                <div className="text-xs font-bold text-slate-900">
                  {user?.fullName || "Doctor"}
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  {user?.userId ? `ID: ${user.userId}` : "Doctor"} &bull; {user?.facilityName || "CHC Khandapada"}
                </div>
              </div>
            </button>

            {/* Logout Button (identical to nurse and patient page) */}
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

        {/* Dynamic Main Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
