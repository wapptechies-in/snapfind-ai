import React from "react";

export { LoadingState, LoadingSpinner } from "./LoadingState";
export type { LoadingStateProps } from "./LoadingState";
export { EmptyState } from "./EmptyState";
export type { EmptyStateProps } from "./EmptyState";
export { ErrorState } from "./ErrorState";
export type { ErrorStateProps } from "./ErrorState";

export const ProgressBar: React.FC<{
  percent: number;
  className?: string;
  variant?: "gold" | "sage" | "coral" | "forest" | "champagne" | "danger" | "violet" | "good" | "bad" | string;
  showLabel?: boolean;
}> = ({ percent, className = "", variant = "gold", showLabel = false }) => {
  const variantColors: Record<string, string> = {
    gold: "bg-[#D6A84F]",
    sage: "bg-[#5FA58B]",
    coral: "bg-[#E87961]",
    forest: "bg-[#D6A84F]",
    champagne: "bg-[#D6A84F]",
    danger: "bg-[#E87961]",
    violet: "bg-[#D6A84F]",
    good: "bg-[#5FA58B]",
    bad: "bg-[#E87961]",
  };

  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  const colorClass = variantColors[variant] || "bg-[#D6A84F]";

  return (
    <div className={`w-full space-y-1.5 font-sans ${className}`}>
      {showLabel && (
        <div className="flex justify-between text-[11px] font-mono text-[#A8B0BE]">
          <span>Progress</span>
          <span className="font-semibold text-[#F7F5F0]">{clamped}%</span>
        </div>
      )}
      <div className="h-2 w-full rounded-full bg-[#0F1624] overflow-hidden border border-[#232F48] p-0.5">
        <div
          className={`h-full rounded-full ${colorClass} transition-all duration-300`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};

export interface AlertProps {
  type?: "info" | "success" | "warning" | "error";
  children: React.ReactNode;
  className?: string;
  onClose?: () => void;
}

export const Alert: React.FC<AlertProps> = ({
  type = "info",
  children,
  className = "",
  onClose,
}) => {
  const styles = {
    info: "bg-[#5B8BF5]/15 border-[#5B8BF5]/30 text-[#8EB2FF]",
    success: "bg-[#5FA58B]/15 border-[#5FA58B]/30 text-[#5FA58B]",
    warning: "bg-[#D6A84F]/15 border-[#D6A84F]/30 text-[#D6A84F]",
    error: "bg-[#E87961]/15 border-[#E87961]/30 text-[#E87961]",
  };

  return (
    <div
      className={`flex items-center justify-between p-3.5 rounded-xl border text-xs leading-relaxed font-sans ${styles[type]} ${className}`}
      role="alert"
    >
      <div className="flex-1">{children}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-3 text-[#A8B0BE] hover:text-[#F7F5F0] transition-colors cursor-pointer text-sm font-bold"
        >
          ✕
        </button>
      )}
    </div>
  );
};
