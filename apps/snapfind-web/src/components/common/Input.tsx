import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
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
          <label htmlFor={inputId} className="block text-xs font-medium text-dim mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full rounded-lg border bg-base px-3.5 py-2.5 text-sm text-cloud outline-none transition-colors placeholder:text-dim/60 focus:border-violet focus:ring-1 focus:ring-violet ${
            error ? "border-bad" : "border-hairline"
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-bad">{error}</p>}
        {helperText && !error && <p className="mt-1 text-xs text-dim">{helperText}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
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
          <label htmlFor={selectId} className="block text-xs font-medium text-dim mb-1.5">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`w-full rounded-lg border bg-base px-3.5 py-2.5 text-sm text-cloud outline-none transition-colors focus:border-violet focus:ring-1 focus:ring-violet ${
            error ? "border-bad" : "border-hairline"
          } ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-panel text-cloud">
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-xs text-bad">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
    const areaId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={areaId} className="block text-xs font-medium text-dim mb-1.5">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={areaId}
          rows={3}
          className={`w-full rounded-lg border bg-base px-3.5 py-2.5 text-sm text-cloud outline-none transition-colors placeholder:text-dim/60 focus:border-violet focus:ring-1 focus:ring-violet ${
            error ? "border-bad" : "border-hairline"
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-bad">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

