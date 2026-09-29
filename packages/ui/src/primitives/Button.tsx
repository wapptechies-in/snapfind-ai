import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "accent" | "success" | "champagne";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  className = "",
  disabled,
  ...props
}) => {
  const base =
    "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 cursor-pointer select-none active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D6A84F]/40 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 font-sans tracking-wide";

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-xs md:text-sm gap-2",
    lg: "px-5 py-2.5 text-sm md:text-base gap-2.5",
  };

  const normalizedVariant = variant === "champagne" ? "primary" : variant;

  const variantStyles = {
    // Primary: Champagne Gold background, Midnight text
    primary:
      "bg-[#D6A84F] hover:bg-[#C5963E] text-[#0B1220] shadow-sm font-bold active:bg-[#B38734]",
    // Secondary: Deep Slate / Transparent, Gold border, Soft White text
    secondary:
      "bg-[#151D2E] hover:bg-[#1B253B] text-[#F7F5F0] border border-[#D6A84F]/40 hover:border-[#D6A84F] shadow-sm",
    // Outline: Slate border, Soft White text
    outline:
      "border border-[#232F48] text-[#F7F5F0] hover:bg-[#151D2E] hover:border-[#D6A84F]/50 bg-transparent",
    // Accent: Warm Coral (Used sparingly)
    accent:
      "bg-[#E87961] hover:bg-[#D66750] text-[#0B1220] font-bold shadow-sm",
    // Success: Sage Green
    success:
      "bg-[#5FA58B] hover:bg-[#4E9279] text-[#0B1220] font-bold shadow-sm",
    // Ghost
    ghost:
      "bg-transparent hover:bg-[#151D2E] text-[#A8B0BE] hover:text-[#F7F5F0]",
    // Destructive
    danger:
      "bg-[#E87961]/20 hover:bg-[#E87961]/30 text-[#E87961] border border-[#E87961]/40 shadow-sm",
  };

  return (
    <button
      disabled={disabled || loading}
      className={`${base} ${sizeStyles[size]} ${variantStyles[normalizedVariant]} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        icon
      )}
      {children}
    </button>
  );
};
