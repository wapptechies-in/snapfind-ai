import React from "react";
import type { EventStatus, EventType } from "../../types";

interface BadgeProps {
  children: React.ReactNode;
  variant?: EventStatus | EventType | "success" | "warning" | "error" | "neutral" | "violet";
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

  const variantStyles: Record<string, string> = {
    // Statuses
    Active: "bg-good/15 text-good border border-good/20",
    Processing: "bg-violet/15 text-violet-light border border-violet/20 animate-pulse",
    Draft: "bg-hairline text-dim border border-hairline",
    Expired: "bg-bad/15 text-bad border border-bad/20",
    Archived: "bg-panel2 text-dim border border-hairline",
    // Utilities
    success: "bg-good/15 text-good border border-good/20",
    warning: "bg-amber-500/15 text-amber-400 border border-amber-500/20",
    error: "bg-bad/15 text-bad border border-bad/20",
    violet: "bg-violet/20 text-violet-light border border-violet/30",
    neutral: "bg-panel2 text-dim border border-hairline",
  };

  const style = variantStyles[variant] || "bg-panel2 text-dim border border-hairline";

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${sizeStyles[size]} ${style} ${className}`}
    >
      {children}
    </span>
  );
};

