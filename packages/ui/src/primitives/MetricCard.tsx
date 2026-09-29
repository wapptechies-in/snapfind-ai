import React from "react";
import { Card } from "./Card";

export interface MetricCardProps {
  label?: string;
  title?: string;
  value: string | number;
  subtext?: string;
  description?: string;
  icon?: React.ReactNode;
  iconColor?: "gold" | "coral" | "sage";
  trend?: string;
  className?: string;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  title,
  value,
  subtext,
  description,
  icon,
  iconColor = "gold",
  trend,
  className = "",
  onClick,
}) => {
  const displayLabel = title || label || "";
  const displaySubtext = description || subtext;

  const iconColors = {
    gold: "text-[#D6A84F] bg-[#D6A84F]/10 border-[#D6A84F]/20",
    coral: "text-[#E87961] bg-[#E87961]/10 border-[#E87961]/20",
    sage: "text-[#5FA58B] bg-[#5FA58B]/10 border-[#5FA58B]/20",
  };

  return (
    <Card
      hover={Boolean(onClick)}
      padding="md"
      onClick={onClick}
      className={`relative overflow-hidden bg-[#151D2E] border border-[#232F48] ${onClick ? "cursor-pointer" : ""} ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#A8B0BE] font-sans truncate">
            {displayLabel}
          </p>
          <div className="mt-2 text-2xl md:text-3xl font-bold font-sans text-[#F7F5F0] tracking-tight">
            {value}
          </div>
          {displaySubtext && (
            <p className="mt-1 text-xs text-[#A8B0BE] font-sans truncate">
              {displaySubtext}
            </p>
          )}
        </div>

        {icon && (
          <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border ${iconColors[iconColor]}`}>
            {icon}
          </div>
        )}
      </div>

      {trend && (
        <div className="mt-3 pt-2.5 border-t border-[#232F48] flex items-center gap-1.5 text-[11px] font-medium text-[#5FA58B] font-sans">
          <span>{trend}</span>
        </div>
      )}
    </Card>
  );
};
