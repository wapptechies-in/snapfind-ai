import React from "react";

export interface BotanicalLeavesProps {
  className?: string;
  opacity?: number;
  width?: number | string;
  height?: number | string;
}

/**
 * Geometric Lens Aperture Accent (Adapted from botanical leaves for luxury photography theme)
 */
export const BotanicalLeaves: React.FC<BotanicalLeavesProps> = ({
  className = "",
  opacity = 0.25,
  width = 180,
  height = 180,
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`pointer-events-none select-none ${className}`}
      style={{ opacity }}
    >
      <defs>
        <radialGradient id="apertureGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#D6A84F" stopOpacity="0.3" />
          <stop offset="70%" stopColor="#D6A84F" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#D6A84F" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="90" stroke="#D6A84F" strokeWidth="0.8" strokeDasharray="3 4" opacity="0.4" />
      <circle cx="100" cy="100" r="70" stroke="#D6A84F" strokeWidth="1" opacity="0.6" />
      <circle cx="100" cy="100" r="45" fill="url(#apertureGlow)" stroke="#D6A84F" strokeWidth="1.2" opacity="0.8" />
      <line x1="100" y1="10" x2="100" y2="190" stroke="#D6A84F" strokeWidth="0.6" strokeDasharray="4 6" opacity="0.3" />
      <line x1="10" y1="100" x2="190" y2="100" stroke="#D6A84F" strokeWidth="0.6" strokeDasharray="4 6" opacity="0.3" />
    </svg>
  );
};
