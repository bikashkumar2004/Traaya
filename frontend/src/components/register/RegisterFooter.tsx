"use client";

import React from "react";

export const RegisterFooter: React.FC = () => {
  return (
    <footer className="w-full bg-white border-t border-slate-200 py-4 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-around gap-6 text-[10px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-slate-700">MeitY</span>
          <span>Ministry of Electronics &amp; IT</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-slate-700">AYUSH</span>
          <span>Ministry of Ayush</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-slate-700">NHM</span>
          <span>National Health Mission</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-slate-700">C-DAC</span>
          <span>Advanced Computing</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-slate-700">NHA</span>
          <span>National Health Authority</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-slate-700">MoLE</span>
          <span>Labour &amp; Employment</span>
        </div>
      </div>
    </footer>
  );
};
