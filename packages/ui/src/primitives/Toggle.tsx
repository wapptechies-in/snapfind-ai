import React from "react";

export interface ToggleProps {
  label?: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
  label,
  description,
  checked,
  onChange,
  disabled = false,
  className = "",
}) => {
  return (
    <div className={`flex items-start justify-between gap-4 py-2 font-sans ${className}`}>
      {(label || description) && (
        <div className="space-y-0.5 select-none">
          {label && (
            <label
              className={`text-sm font-semibold ${
                disabled ? "text-[#A8B0BE]/40 cursor-not-allowed" : "text-[#F7F5F0] cursor-pointer"
              }`}
              onClick={() => !disabled && onChange(!checked)}
            >
              {label}
            </label>
          )}
          {description && (
            <p className="text-xs text-[#A8B0BE] leading-relaxed">{description}</p>
          )}
        </div>
      )}

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#D6A84F]/40 ${
          checked ? "bg-[#D6A84F]" : "bg-[#0F1624] border-[#232F48]"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[#0B1220] shadow-md ring-0 transition duration-200 ease-in-out ${
            checked ? "translate-x-5 bg-[#0B1220]" : "translate-x-0 bg-[#A8B0BE]"
          }`}
        />
      </button>
    </div>
  );
};
