"use client";

import React from "react";
import { AuthSetupCategory } from "./types";

interface LoginBrandPanelProps {
  setupMode?: AuthSetupCategory;
}

export const LoginBrandPanel: React.FC<LoginBrandPanelProps> = () => {
  return (
    <div className="hidden lg:flex w-full lg:w-[50%] xl:w-[50%] p-6 xl:p-8 relative overflow-hidden flex-col items-center justify-center shrink-0 h-full">
      <div className="relative w-full h-full max-h-[90vh] flex items-center justify-center translate-x-2 lg:translate-x-4 xl:translate-x-8">
        <img
          src="/Doctor nurse patient portrait.png"
          alt="TRAAYA Clinical Triage Care Team"
          className="max-h-full max-w-full object-contain select-none pointer-events-none drop-shadow-xs"
        />
      </div>
    </div>
  );
};
