"use client";

import React from "react";

export type UrgencyType = "Immediate" | "Urgent" | "Less Urgent" | "Routine" | "Priority" | string;

interface UrgencyBadgeProps {
  urgency: UrgencyType;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function UrgencyBadge({ urgency, className = "", size = "md" }: UrgencyBadgeProps) {
  const norm = (urgency || "").toLowerCase();

  let bg = "bg-emerald-50 text-emerald-800 border-emerald-200";
  let dot = "bg-emerald-500";
  let label = "Less Urgent";

  if (
    norm.includes("immediate") ||
    norm.includes("immidiate") ||
    norm.includes("red") ||
    norm.includes("emergency") ||
    norm.includes("critical")
  ) {
    bg = "bg-rose-50 text-rose-800 border-rose-200";
    dot = "bg-rose-600 animate-ping";
    label = "Immediate";
  } else if (norm.includes("less urgent") || norm.includes("green") || norm.includes("low")) {
    bg = "bg-emerald-50 text-emerald-800 border-emerald-200";
    dot = "bg-emerald-500";
    label = "Less Urgent";
  } else if (norm.includes("routine") || norm.includes("fit")) {
    bg = "bg-emerald-50 text-emerald-800 border-emerald-200";
    dot = "bg-emerald-500";
    label = "Routine";
  } else if (norm.includes("urgent") || norm.includes("yellow") || norm.includes("priority") || norm.includes("moderate")) {
    bg = "bg-amber-50 text-amber-800 border-amber-200";
    dot = "bg-amber-500 animate-pulse";
    label = "Urgent";
  }

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs font-semibold",
    lg: "px-3.5 py-1.5 text-sm font-semibold"
  };

  const isImmediate = label === "Immediate";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border shadow-xs transition-colors ${sizeClasses[size]} ${bg} ${className}`}
    >
      <span className="relative flex h-2 w-2">
        {isImmediate && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${dot}`} />
      </span>
      <span>{label}</span>
    </span>
  );
}
