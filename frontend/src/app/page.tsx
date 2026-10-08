"use client";

import React from "react";
import {
  LandingHero,
  LandingStats,
  LandingCareContinuum,
  LandingWorkflow,
  LandingUrgencySystem,
  LandingGovernance,
  LandingPilotCta,
  LandingDisclaimer,
} from "@/components/landing";

export default function LandingPage() {
  return (
    <div className="space-y-20 pb-16 font-sans">
      <LandingHero />
      <LandingStats />
      <LandingCareContinuum />
      <LandingWorkflow />
      <LandingUrgencySystem />
      <LandingGovernance />
      <LandingPilotCta />
      <LandingDisclaimer />
    </div>
  );
}
