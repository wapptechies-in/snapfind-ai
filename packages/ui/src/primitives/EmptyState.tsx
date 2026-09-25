import React from "react";
import { Button } from "./Button";

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  className = "",
}) => {
  return (
    <div
      className={`mx-auto flex max-w-md flex-col items-center justify-center rounded-2xl border border-dashed border-warm-border bg-white/70 p-8 text-center backdrop-blur-sm ${className}`}
    >
      {/* Botanical / Minimalist Emblem */}
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cream text-forest border border-warm-border">
        {icon || (
          <svg
            className="h-7 w-7 text-forest"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 3a9 9 0 0 0-9 9c0 4.97 4.03 9 9 9s9-4.03 9-9" />
            <path d="M12 3c3 3 5 7 5 10" />
            <path d="M12 3c-3 3-5 7-5 10" />
            <path d="M12 21V12" />
          </svg>
        )}
      </div>

      <h3 className="font-serif text-lg font-bold text-charcoal">{title}</h3>
      <p className="mt-1.5 text-xs md:text-sm text-warm-gray leading-relaxed max-w-sm font-body">
        {description}
      </p>

      {actionLabel && onAction && (
        <div className="mt-5">
          <Button variant="primary" size="md" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
