import React from "react";

export interface LoadingStateProps {
  message?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = "Loading photography workspace...",
  className = "",
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center select-none ${className}`}>
      <div className="relative flex h-12 w-12 items-center justify-center">
        <span className="absolute h-10 w-10 animate-ping rounded-full bg-[#D6A84F]/20 opacity-60" />
        <span className="relative h-6 w-6 rounded-full border-2 border-[#D6A84F] border-t-transparent animate-spin" />
      </div>
      <p className="mt-4 font-sans text-xs text-[#A8B0BE]">{message}</p>
    </div>
  );
};

export const LoadingSpinner = LoadingState;
