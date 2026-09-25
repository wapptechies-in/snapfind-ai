import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "accent" | "champagne";
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
    "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 cursor-pointer select-none active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 font-body";

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-xs md:text-sm gap-2",
    lg: "px-5 py-2.5 text-sm md:text-base gap-2.5",
  };

  const normalizedVariant = variant === "champagne" ? "accent" : variant;

  const variantStyles = {
    primary:
      "bg-forest hover:bg-forest-hover text-white shadow-sm border border-forest-hover/40 active:bg-forest-dark",
    secondary:
      "bg-white hover:bg-cream text-charcoal border border-warm-border shadow-card active:bg-cream-soft",
    accent:
      "bg-champagne hover:bg-champagne-dark text-white shadow-sm border border-champagne-light",
    outline:
      "border border-warm-border text-warm-gray hover:text-charcoal hover:bg-cream-soft hover:border-warm-gray-light/40 bg-transparent",
    ghost:
      "bg-transparent hover:bg-cream text-warm-gray hover:text-charcoal active:bg-cream-soft",
    danger:
      "bg-danger-bg hover:bg-danger/20 text-danger border border-danger-border shadow-sm",
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
