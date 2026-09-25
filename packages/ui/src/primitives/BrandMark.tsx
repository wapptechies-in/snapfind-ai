import React from "react";

export interface BrandMarkProps {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  className?: string;
  badge?: string;
}

export const BrandMark: React.FC<BrandMarkProps> = ({
  size = "md",
  showTagline = true,
  className = "",
  badge,
}) => {
  const iconSizes = {
    sm: "h-7 w-7 rounded-lg text-xs",
    md: "h-9 w-9 rounded-xl text-sm",
    lg: "h-12 w-12 rounded-2xl text-lg",
  };

  const titleSizes = {
    sm: "text-xs tracking-tight",
    md: "text-sm tracking-tight",
    lg: "text-xl tracking-tight",
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Brand Icon: Botanical Camera Emblem */}
      <div
        className={`relative flex items-center justify-center bg-[#1E3A2F] text-white shadow-xs flex-shrink-0 rounded-xl ${iconSizes[size]}`}
      >
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
          <path d="M12 6 C 14 3.5, 17 3, 19 4 C 18 6, 16 8, 13.5 8" fill="#8FA899" stroke="none" />
        </svg>
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={`font-serif font-bold text-[#1A1C1A] ${titleSizes[size]}`}>
            SnapFind <span className="font-sans font-semibold text-[#1E3A2F]">Studio</span>
          </span>
          {badge && (
            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider bg-champagne-soft text-champagne-dark border border-champagne-light">
              {badge}
            </span>
          )}
        </div>
        {showTagline && (
          <p className="text-[10px] text-warm-gray tracking-wider uppercase font-medium">
            Every Moment Finds You
          </p>
        )}
      </div>
    </div>
  );
};
