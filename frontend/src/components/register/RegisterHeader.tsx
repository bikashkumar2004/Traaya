"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Activity, Globe, ChevronDown, UserCheck } from "lucide-react";
import { INDIAN_LANGUAGES } from "@/lib/auth-context";

interface RegisterHeaderProps {
  language: string;
  setLanguage: (lang: string) => void;
}

export const RegisterHeader: React.FC<RegisterHeaderProps> = ({
  language,
  setLanguage,
}) => {
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [langSearch, setLangSearch] = useState("");
  const currentLangObj =
    INDIAN_LANGUAGES.find((l) => l.code === language) || INDIAN_LANGUAGES[0];

  const filteredLanguages = INDIAN_LANGUAGES.filter(
    (l) =>
      l.name.toLowerCase().includes(langSearch.toLowerCase()) ||
      l.nativeName.toLowerCase().includes(langSearch.toLowerCase()) ||
      l.code.toLowerCase().includes(langSearch.toLowerCase())
  );

  return (
    <header className="w-full bg-white border-b border-slate-200 shrink-0 z-50">
      <div className="w-full px-4 sm:px-6 lg:px-10 flex items-center justify-between h-14 sm:h-16">
        {/* Logo & National Gateway Label */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-teal-700 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900">
                Triage<span className="text-teal-700">Assist</span>
              </span>
            </div>
            <div className="text-[10px] sm:text-[11px] font-semibold text-slate-500 leading-none">
              National Clinical Gateway
            </div>
          </div>
        </Link>

        {/* Right Action Items */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Emergency Dial Pill */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
            <span>Emergency? Dial <strong>108</strong> / <strong>102</strong></span>
          </div>

          {/* Indian Regional Languages Dropdown */}
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

          {/* Profile Avatar Button */}
          <div className="w-8 h-8 rounded-full bg-[#064e43] text-white flex items-center justify-center shadow-xs cursor-pointer hover:opacity-90">
            <UserCheck className="w-4 h-4" />
          </div>
        </div>
      </div>
    </header>
  );
};
