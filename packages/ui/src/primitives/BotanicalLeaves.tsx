import React from "react";

export interface BotanicalLeavesProps {
  className?: string;
  opacity?: number;
  width?: number | string;
  height?: number | string;
}

export const BotanicalLeaves: React.FC<BotanicalLeavesProps> = ({
  className = "",
  opacity = 0.85,
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
        <linearGradient id="leafGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7A9A82" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#2E503E" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id="leafGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#9BB8A2" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#41634F" stopOpacity="0.85" />
        </linearGradient>
        <linearGradient id="stemGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#4A6854" />
          <stop offset="100%" stopColor="#8DA894" />
        </linearGradient>
      </defs>

      {/* Main Curved Stem */}
      <path
        d="M10 190 C 40 160, 80 130, 140 70 C 160 50, 180 30, 190 10"
        stroke="url(#stemGrad)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Secondary branch */}
      <path
        d="M60 145 C 90 110, 110 80, 130 50"
        stroke="url(#stemGrad)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      {/* Leaves along primary stem */}
      <path
        d="M190 10 C 185 25, 170 30, 160 25 C 165 15, 180 8, 190 10 Z"
        fill="url(#leafGrad1)"
      />
      <path
        d="M165 45 C 150 40, 140 50, 142 62 C 155 60, 165 52, 165 45 Z"
        fill="url(#leafGrad2)"
      />
      <path
        d="M140 70 C 130 85, 115 88, 108 78 C 118 70, 130 68, 140 70 Z"
        fill="url(#leafGrad1)"
      />
      <path
        d="M115 95 C 100 90, 90 100, 92 112 C 105 110, 115 102, 115 95 Z"
        fill="url(#leafGrad2)"
      />
      <path
        d="M90 120 C 80 135, 65 138, 58 128 C 68 120, 80 118, 90 120 Z"
        fill="url(#leafGrad1)"
      />
      <path
        d="M65 145 C 50 140, 40 150, 42 162 C 55 160, 65 152, 65 145 Z"
        fill="url(#leafGrad2)"
      />
      <path
        d="M40 170 C 30 185, 15 188, 8 178 C 18 170, 30 168, 40 170 Z"
        fill="url(#leafGrad1)"
      />

      {/* Secondary small accent buds/leaves */}
      <path
        d="M130 50 C 122 40, 110 42, 108 50 C 116 54, 126 53, 130 50 Z"
        fill="url(#leafGrad2)"
      />
      <path
        d="M85 105 C 75 112, 68 108, 70 100 C 78 98, 83 100, 85 105 Z"
        fill="url(#leafGrad1)"
      />
    </svg>
  );
};
