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
      className={`mx-auto flex max-w-md flex-col items-center justify-center rounded-xl border border-dashed border-[#232F48] bg-[#151D2E]/90 p-8 text-center backdrop-blur-sm ${className}`}
    >
      {/* Camera / Geometry Icon */}
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[#0F1624] text-[#D6A84F] border border-[#232F48]">
        {icon || (
          <svg
            className="h-7 w-7 text-[#D6A84F]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        )}
      </div>

      <h3 className="font-sans text-base font-bold text-[#F7F5F0]">{title}</h3>
      <p className="mt-1.5 text-xs md:text-sm text-[#A8B0BE] leading-relaxed max-w-sm font-sans">
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
