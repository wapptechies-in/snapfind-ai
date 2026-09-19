import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  hover = false,
  ...props
}) => {
  return (
    <div
      className={`rounded-xl border border-hairline bg-panel ${
        hover ? "transition-all hover:border-dim/40 hover:bg-panel2/50" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

