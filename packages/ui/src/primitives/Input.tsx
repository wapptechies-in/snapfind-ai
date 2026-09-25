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
          <label htmlFor={inputId} className="block text-xs font-semibold text-charcoal mb-1.5 font-body">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-xs md:text-sm text-charcoal outline-none transition-all placeholder:text-warm-gray-light focus:border-forest focus:ring-2 focus:ring-forest/15 font-body shadow-sm ${
            error ? "border-danger focus:border-danger focus:ring-danger/15" : "border-warm-border hover:border-warm-gray-light/60"
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-danger font-body">{error}</p>}
        {helperText && !error && <p className="mt-1 text-xs text-warm-gray font-body">{helperText}</p>}
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
          <label htmlFor={selectId} className="block text-xs font-semibold text-charcoal mb-1.5 font-body">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-xs md:text-sm text-charcoal outline-none transition-all focus:border-forest focus:ring-2 focus:ring-forest/15 font-body shadow-sm ${
            error ? "border-danger focus:border-danger focus:ring-danger/15" : "border-warm-border hover:border-warm-gray-light/60"
          } ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-white text-charcoal py-1">
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-xs text-danger font-body">{error}</p>}
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
          <label htmlFor={textareaId} className="block text-xs font-semibold text-charcoal mb-1.5 font-body">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-xs md:text-sm text-charcoal outline-none transition-all placeholder:text-warm-gray-light focus:border-forest focus:ring-2 focus:ring-forest/15 font-body shadow-sm ${
            error ? "border-danger focus:border-danger focus:ring-danger/15" : "border-warm-border hover:border-warm-gray-light/60"
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-danger font-body">{error}</p>}
        {helperText && !error && <p className="mt-1 text-xs text-warm-gray font-body">{helperText}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
