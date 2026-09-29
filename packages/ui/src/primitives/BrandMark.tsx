import React from "react";

export interface BrandMarkProps {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  className?: string;
  badge?: string;
  lightMode?: boolean;
}

export const BrandMark: React.FC<BrandMarkProps> = ({
  size = "md",
  showTagline = true,
  className = "",
  badge,
  lightMode = false,
}) => {
  const iconSizes = {
    sm: "h-7 w-7 rounded-lg text-xs",
    md: "h-9 w-9 rounded-xl text-sm",
    lg: "h-11 w-11 rounded-2xl text-lg",
  };

  const titleSizes = {
    sm: "text-xs tracking-tight",
    md: "text-sm tracking-tight",
    lg: "text-lg tracking-tight",
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Brand Icon: Camera Geometry with Champagne Gold Accent */}
      <div
        className={`relative flex items-center justify-center bg-[#151D2E] text-[#F7F5F0] border border-[#232F48] shadow-sm flex-shrink-0 ${iconSizes[size]}`}
      >
        <svg
          className="w-5 h-5 text-[#D6A84F]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Camera body outline */}
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          {/* Lens */}
          <circle cx="12" cy="13" r="4" stroke="#F7F5F0" strokeWidth="1.6" />
          {/* Aperture dot / optical flash in gold */}
          <circle cx="12" cy="13" r="1.5" fill="#D6A84F" stroke="none" />
        </svg>
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={`font-sans font-bold ${lightMode ? "text-[#0B1220]" : "text-[#F7F5F0]"} ${titleSizes[size]}`}>
            SnapFind <span className="font-semibold text-[#D6A84F]">AI</span>
          </span>
          {badge && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[#D6A84F]/15 text-[#D6A84F] border border-[#D6A84F]/30">
              {badge}
            </span>
          )}
        </div>
        {showTagline && (
          <p className={`text-[10px] tracking-wider uppercase font-medium truncate ${lightMode ? "text-[#687385]" : "text-[#A8B0BE]"}`}>
            Luxury Photography
          </p>
        )}
      </div>
    </div>
  );
};
