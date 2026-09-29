import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = "", id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-[#F7F5F0] mb-1.5 font-sans">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full rounded-xl border bg-[#0F1624] px-3.5 py-2.5 text-xs md:text-sm text-[#F7F5F0] outline-none transition-all placeholder:text-[#6E788B] focus:border-[#D6A84F] focus:ring-1 focus:ring-[#D6A84F]/40 font-sans shadow-sm ${
            error ? "border-[#E87961] focus:border-[#E87961] focus:ring-[#E87961]/30" : "border-[#232F48] hover:border-[#334263]"
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-[#E87961] font-sans">{error}</p>}
        {helperText && !error && <p className="mt-1 text-xs text-[#A8B0BE] font-sans">{helperText}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = "", id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-xs font-semibold text-[#F7F5F0] mb-1.5 font-sans">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`w-full rounded-xl border bg-[#0F1624] px-3.5 py-2.5 text-xs md:text-sm text-[#F7F5F0] outline-none transition-all focus:border-[#D6A84F] focus:ring-1 focus:ring-[#D6A84F]/40 font-sans shadow-sm ${
            error ? "border-[#E87961] focus:border-[#E87961] focus:ring-[#E87961]/30" : "border-[#232F48] hover:border-[#334263]"
          } ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[#151D2E] text-[#F7F5F0]">
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-xs text-[#E87961] font-sans">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className = "", id, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={textareaId} className="block text-xs font-semibold text-[#F7F5F0] mb-1.5 font-sans">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={`w-full rounded-xl border bg-[#0F1624] px-3.5 py-2.5 text-xs md:text-sm text-[#F7F5F0] outline-none transition-all placeholder:text-[#6E788B] focus:border-[#D6A84F] focus:ring-1 focus:ring-[#D6A84F]/40 font-sans shadow-sm resize-none ${
            error ? "border-[#E87961] focus:border-[#E87961] focus:ring-[#E87961]/30" : "border-[#232F48] hover:border-[#334263]"
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-[#E87961] font-sans">{error}</p>}
        {helperText && !error && <p className="mt-1 text-xs text-[#A8B0BE] font-sans">{helperText}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

