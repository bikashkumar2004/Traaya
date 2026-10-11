"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Activity, ArrowLeft, ShieldCheck, Globe, ChevronDown } from "lucide-react";
import { INDIAN_LANGUAGES } from "@/lib/auth-context";

interface LoginHeaderProps {
  language: string;
  setLanguage: (lang: string) => void;
  onAdminLogin: () => void;
}

export const LoginHeader: React.FC<LoginHeaderProps> = ({
  language,
  setLanguage,
  onAdminLogin,
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
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs shrink-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <img
              src="/traaya-logo.png"
              alt="TRAAYA Logo"
              className="h-9 w-auto object-contain shrink-0 group-hover:scale-105 transition-transform"
            />
          </Link>

          {/* Right Action Items */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            <Link
              href="/"
              className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
              <span>Back to Home</span>
            </Link>

            {/* Direct Admin Quick Access Button */}
            <button
              type="button"
              onClick={onAdminLogin}
              className="flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-2xs"
              title="Direct Administrator Access"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
              <span>Admin Login</span>
            </button>

            {/* Indian Languages Selector */}
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
          </div>
        </div>
      </div>
    </header>
  );
};
