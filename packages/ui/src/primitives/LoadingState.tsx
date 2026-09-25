import React from "react";

export interface LoadingStateProps {
  message?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = "Loading studio memories...",
  className = "",
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center select-none ${className}`}>
      <div className="relative flex h-12 w-12 items-center justify-center">
        <span className="absolute h-10 w-10 animate-ping rounded-full bg-sage-soft opacity-60" />
        <span className="relative h-6 w-6 rounded-full border-2 border-forest border-t-transparent animate-spin" />
      </div>
      <p className="mt-4 font-serif text-sm italic text-warm-gray">{message}</p>
    </div>
  );
};

export const LoadingSpinner = LoadingState;
