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

  let style = "bg-cream text-warm-gray border border-warm-border";

  if (normalized === "active" || normalized === "completed" || normalized === "success" || normalized === "approved") {
    style = "bg-success-bg text-success border border-success-border font-medium";
  } else if (normalized === "inactive" || normalized === "pending") {
    style = "bg-warning-bg text-warning border border-warning-border font-medium";
  } else if (normalized === "processing") {
    style = "bg-sage-soft text-sage border border-sage-border font-medium animate-pulse";
  } else if (normalized === "failed" || normalized === "error" || normalized === "expired" || normalized === "rejected" || normalized === "suspended") {
    style = "bg-danger-bg text-danger border border-danger-border font-medium";
  } else if (normalized === "champagne" || normalized === "pro" || normalized === "gold") {
    style = "bg-champagne-soft text-champagne-dark border border-champagne-light font-medium";
  } else if (normalized === "forest") {
    style = "bg-forest-tint text-forest border border-forest/20 font-medium";
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full select-none ${sizeStyles[size]} ${style} ${className}`}
    >
      {children}
    </span>
  );
};
