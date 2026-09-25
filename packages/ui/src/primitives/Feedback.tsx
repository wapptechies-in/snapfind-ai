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
  variant?: "forest" | "sage" | "champagne" | "danger" | "violet" | "good" | "bad" | string;
  showLabel?: boolean;
}> = ({ percent, className = "", variant = "forest", showLabel = false }) => {
  const variantColors: Record<string, string> = {
    forest: "bg-forest",
    sage: "bg-sage",
    champagne: "bg-champagne",
    danger: "bg-danger",
    violet: "bg-forest",
    good: "bg-forest",
    bad: "bg-danger",
  };

  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  const colorClass = variantColors[variant] || "bg-forest";

  return (
    <div className={`w-full space-y-1.5 font-body ${className}`}>
      {showLabel && (
        <div className="flex justify-between text-[11px] font-mono text-warm-gray">
          <span>Progress</span>
          <span className="font-semibold text-charcoal">{clamped}%</span>
        </div>
      )}
      <div className="h-2 w-full rounded-full bg-cream overflow-hidden border border-warm-border p-0.5">
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
    info: "bg-info-bg border-info-border text-info",
    success: "bg-success-bg border-success-border text-success",
    warning: "bg-warning-bg border-warning-border text-warning",
    error: "bg-danger-bg border-danger-border text-danger",
  };

  return (
    <div
      className={`flex items-center justify-between p-3.5 rounded-xl border text-xs leading-relaxed font-body ${styles[type]} ${className}`}
      role="alert"
    >
      <div className="flex-1">{children}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-3 text-warm-gray hover:text-charcoal transition-colors cursor-pointer text-sm font-bold"
        >
          ✕
        </button>
      )}
    </div>
  );
};
