import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}) => {
  const base =
    "inline-flex items-center justify-center font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none";

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-6 py-2.5 text-base gap-2.5",
  };

  const variantStyles = {
    primary: "bg-violet hover:bg-violet-light text-white shadow-sm",
    secondary: "bg-panel2 hover:bg-hairline text-cloud border border-hairline",
    danger: "bg-bad/20 hover:bg-bad/30 text-bad border border-bad/30",
    ghost: "bg-transparent hover:bg-panel2 text-dim hover:text-cloud",
  };

  return (
    <button
      className={`${base} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = "",
  children,
  ...props
}) => {
  return (
    <div
      className={`rounded-xl border border-hairline bg-panel/70 p-6 backdrop-blur-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export interface BadgeProps {
  variant?: "active" | "processing" | "completed" | "failed" | "neutral";
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = "neutral",
  children,
  className = "",
}) => {
  const styles = {
    active: "bg-good/15 text-good border-good/30",
    processing: "bg-violet/15 text-violet-light border-violet/30 animate-pulse",
    completed: "bg-good/15 text-good border-good/30",
    failed: "bg-bad/15 text-bad border-bad/30",
    neutral: "bg-panel2 text-dim border-hairline",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

export const ProgressBar: React.FC<{
  percent: number;
  className?: string;
  variant?: "violet" | "good" | "bad";
}> = ({ percent, className = "", variant = "violet" }) => {
  const gradients = {
    violet: "from-violet to-violet-light",
    good: "from-good to-emerald-400",
    bad: "from-bad to-rose-400",
  };

  return (
    <div
      className={`h-2.5 w-full rounded-full bg-panel2 overflow-hidden border border-hairline p-0.5 ${className}`}
    >
      <div
        className={`h-full rounded-full bg-gradient-to-r ${gradients[variant]} transition-all duration-300`}
        style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
      />
    </div>
  );
};

export const LoadingSpinner: React.FC<{ message?: string }> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-hairline border-t-violet" />
      {message && <p className="text-xs text-dim font-medium">{message}</p>}
    </div>
  );
};

export const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-hairline bg-panel p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-hairline">
          <h3 className="text-base font-semibold text-cloud">{title}</h3>
          <button
            onClick={onClose}
            className="text-dim hover:text-white transition-colors cursor-pointer text-lg leading-none p-1"
          >
            ✕
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
};
