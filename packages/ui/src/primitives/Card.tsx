import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  hover = false,
  padding = "none",
  ...props
}) => {
  const paddingStyles = {
    none: "",
    sm: "p-3.5 md:p-4",
    md: "p-5 md:p-6",
    lg: "p-6 md:p-8",
  };

  const hoverStyle = hover
    ? "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover hover:border-[#D6A84F]/40"
    : "transition-all duration-200";

  return (
    <div
      className={`rounded-xl border border-[#232F48] bg-[#151D2E] text-[#F7F5F0] shadow-card ${paddingStyles[padding]} ${hoverStyle} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
