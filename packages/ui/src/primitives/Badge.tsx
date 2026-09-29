import React from "react";
import type { EventStatus, EventType } from "@snapfind/types";

export interface BadgeProps {
  children: React.ReactNode;
  variant?: EventStatus | EventType | "active" | "processing" | "completed" | "failed" | "success" | "warning" | "error" | "neutral" | "champagne" | "forest" | string;
  className?: string;
  size?: "sm" | "md";
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "neutral",
  size = "md",
  className = "",
}) => {
  const sizeStyles = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-xs",
  };

  const normalized = (variant || "neutral").toString().toLowerCase();

  let style = "bg-[#151D2E] text-[#A8B0BE] border border-[#232F48]";

  if (normalized === "active" || normalized === "completed" || normalized === "success" || normalized === "approved" || normalized === "online") {
    // Sage Green
    style = "bg-[#5FA58B]/15 text-[#5FA58B] border border-[#5FA58B]/35 font-medium";
  } else if (normalized === "processing" || normalized === "indexing" || normalized === "champagne" || normalized === "pro" || normalized === "gold") {
    // Champagne Gold
    style = "bg-[#D6A84F]/15 text-[#D6A84F] border border-[#D6A84F]/35 font-medium";
  } else if (normalized === "failed" || normalized === "error" || normalized === "expired" || normalized === "rejected" || normalized === "suspended" || normalized === "draft") {
    // Warm Coral
    style = "bg-[#E87961]/15 text-[#E87961] border border-[#E87961]/35 font-medium";
  } else if (normalized === "inactive" || normalized === "pending") {
    // Subtle Gold
    style = "bg-[#D6A84F]/10 text-[#D6A84F] border border-[#D6A84F]/25 font-medium";
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-sans font-medium rounded-full select-none ${sizeStyles[size]} ${style} ${className}`}
    >
      {children}
    </span>
  );
};
