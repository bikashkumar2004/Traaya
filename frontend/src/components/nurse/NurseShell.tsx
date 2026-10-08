"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  LayoutDashboard,
  UserPlus,
  ListChecks,
  History,
  Building2,
  Search,
  Bell,
  Activity,
  Menu,
  X,
  ChevronDown,
  User,
  ShieldCheck,
  LogOut
} from "lucide-react";

export type NurseNavTab =
  | "dashboard"
  | "intake"
  | "queue"
  | "activity"
  | "facility"
  | "profile";

interface NurseShellProps {
  children: React.ReactNode;
  activeTab?: NurseNavTab;
  onTabChange?: (tab: NurseNavTab) => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export function NurseShell({
  children,
  activeTab = "dashboard",
  onTabChange,
  searchQuery = "",
  onSearchChange,
}: NurseShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const navItems: Array<{ id: NurseNavTab; label: string; icon: React.ElementType; href: string }> = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/nurse" },
    { id: "intake", label: "Patient Intake", icon: UserPlus, href: "/nurse?tab=intake" },
    { id: "queue", label: "Triage Queue", icon: ListChecks, href: "/nurse?tab=queue" },
    { id: "activity", label: "Case Activity", icon: History, href: "/nurse?tab=activity" },
    { id: "facility", label: "Facility Availability", icon: Building2, href: "/nurse?tab=facility" },
    { id: "profile", label: "My Profile", icon: User, href: "/nurse?tab=profile" },
  ];

  const handleNavClick = (tabId: NurseNavTab) => {
    setMobileSidebarOpen(false);
    if (onTabChange) {
      onTabChange(tabId);
    } else {
      router.push(`/nurse?tab=${tabId}`);
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

      {/* LEFT SIDEBAR (Light Soft Blue #EAF1FF like patient page) - Fixed Position */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 h-screen bg-[#EAF1FF] text-slate-800 flex flex-col justify-between border-r border-blue-200/70 transition-transform duration-200 ${
          mobileSidebarOpen ? "translate-x-0 shadow-2xl z-50" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Top Brand with Landing Page Logo */}
          <div className="p-4 border-b border-blue-200/60 flex items-center justify-between shrink-0">
            <Link href="/nurse" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-teal-700 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform shrink-0">
                <Activity className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-extrabold text-base tracking-tight text-slate-900 leading-tight">
                  Triage<span className="text-teal-700">Assist</span>
                </span>
                <span className="text-[10px] font-semibold text-teal-800 tracking-wide leading-none mt-1">
                  Nurse Command Station
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

          {/* Navigation Items (Patient theme styling) */}
          <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 w-full text-left cursor-pointer ${
                    isActive
                      ? "bg-teal-700 text-white shadow-sm font-bold"
                      : "text-slate-700 hover:text-teal-900 hover:bg-white/80"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? "text-white" : "text-teal-700/80"
                    }`}
                  />
                  <span className="flex-1">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Bottom Actions in Sidebar (Patient theme styling) */}
          <div className="p-3 border-t border-blue-200/70 bg-[#dbe8fd]/50 space-y-2 shrink-0">
            <div className="flex items-center gap-2.5 p-2 bg-white/80 rounded-xl border border-blue-200/60">
              <div className="w-8 h-8 rounded-lg bg-teal-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-900 truncate" title={user?.facilityName || "Designated Health Facility"}>
                  {user?.facilityName || "Designated Health Facility"}
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
        {/* Top Header without duplicate logo, with Language Dropdown like patient page */}
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

            {/* Breadcrumb / Station context on left instead of redundant logo */}
            <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-600">
              <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 max-w-[220px] truncate" title={user?.facilityName || "Designated Health Facility"}>
                {user?.facilityName || "Designated Health Facility"}
              </span>
              <span className="text-slate-300">&bull;</span>
              <span className="text-slate-500 font-medium">
                Nurse Command Station
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

          {/* Right Actions: Regional Language Dropdown, Notification Bell & Nurse Profile */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Notifications Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white font-bold text-[9px] rounded-full flex items-center justify-center shadow-xs">
                  3
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
                      3 New
                    </span>
                  </div>
                  <div className="p-2 bg-amber-50/70 rounded-xl border border-amber-200/70 text-slate-800">
                    <div className="font-bold text-amber-900">
                      Case #LS1024 Needs Review
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5">
                      High Priority fever with body pain reported 10m ago
                    </div>
                  </div>
                  <div className="p-2 bg-teal-50/70 rounded-xl border border-teal-200/70 text-slate-800">
                    <div className="font-bold text-teal-900">
                      Doctor / Staff A Available
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5">
                      Dr. Ananya Sen signed in to CHC Khandapada
                    </div>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl border border-slate-200 text-slate-800">
                    <div className="font-bold text-slate-900">
                      Lab Sync Completed
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5">
                      CBC report uploaded for Patient PT-0042
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Pill: Click navigates to Profile tab! */}
            <button
              type="button"
              onClick={() => handleNavClick("profile")}
              className={`flex items-center gap-2.5 p-1 pl-1.5 pr-2.5 rounded-xl border transition-all cursor-pointer ${
                activeTab === "profile"
                  ? "bg-teal-50 border-teal-300 ring-2 ring-teal-100"
                  : "bg-white border-slate-200 hover:bg-slate-50"
              }`}
              title="View Nurse Profile & Credentials"
            >
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-teal-800 text-white font-bold flex items-center justify-center text-xs shadow-xs ring-2 ring-white">
                  {user?.fullName
                    ? user.fullName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()
                    : "NS"}
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
              </div>
              <div className="hidden sm:block text-left leading-tight">
                <div className="text-xs font-bold text-slate-900">
                  {user?.fullName || "Nurse Staff"}
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  {user?.userId ? `ID: ${user.userId}` : "Nurse"} &bull; {user?.facilityName || "CHC Khandapada"}
                </div>
              </div>
            </button>

            {/* Logout Button (like patient page) */}
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
