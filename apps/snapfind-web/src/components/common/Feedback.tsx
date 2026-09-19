import React from "react";
import { Button } from "./Button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = "",
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center rounded-xl border border-hairline bg-panel2/30 ${className}`}>
      {icon ? (
        <div className="mb-4 text-dim">{icon}</div>
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-panel2 text-dim mb-4 border border-hairline">
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 3v18M3 9h18" />
          </svg>
        </div>
      )}
      <h3 className="text-base font-semibold text-cloud">{title}</h3>
      <p className="mt-1 text-sm text-dim max-w-sm">{description}</p>
      {actionLabel && onAction && (
        <div className="mt-6">
          <Button onClick={onAction}>{actionLabel}</Button>
        </div>
      )}
    </div>
  );
};

export const LoadingSpinner: React.FC<{ message?: string; className?: string }> = ({
  message = "Loading...",
  className = "",
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-12 gap-3 text-dim ${className}`}>
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet border-t-transparent" />
      <span className="text-sm">{message}</span>
    </div>
  );
};

interface AlertProps {
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
    info: "bg-panel2 border-hairline text-cloud",
    success: "bg-good/10 border-good/30 text-good",
    warning: "bg-amber-500/10 border-amber-500/30 text-amber-300",
    error: "bg-bad/10 border-bad/30 text-bad",
  };

  return (
    <div
      className={`flex items-start justify-between gap-3 rounded-lg border p-3.5 text-sm ${styles[type]} ${className}`}
      role="alert"
    >
      <div className="flex-1">{children}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-dim hover:text-cloud transition-colors text-xs"
        >
          ✕
        </button>
      )}
    </div>
  );
};

