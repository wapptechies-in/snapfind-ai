import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
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
    "inline-flex items-center justify-center font-medium rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-base disabled:opacity-50 disabled:cursor-not-allowed";

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-5 py-2.5 text-base gap-2.5",
  };

  const variantStyles = {
    primary: "bg-violet text-white hover:bg-violet-light active:brightness-95",
    secondary: "bg-panel2 text-cloud hover:bg-hairline active:bg-panel border border-hairline",
    outline: "border border-hairline text-dim hover:text-cloud hover:border-dim/40 bg-transparent",
    ghost: "text-dim hover:text-cloud hover:bg-panel2 active:bg-hairline",
    danger: "bg-bad/15 text-bad border border-bad/30 hover:bg-bad/25",
  };

  return (
    <button
      disabled={disabled || loading}
      className={`${base} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        icon
      )}
      {children}
    </button>
  );
};

