import React from "react";
import { Card } from "./Card";

export interface MetricCardProps {
  label?: string;
  title?: string;
  value: string | number;
  subtext?: string;
  description?: string;
  icon?: React.ReactNode;
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
  trend,
  className = "",
  onClick,
}) => {
  const displayLabel = title || label || "";
  const displaySubtext = description || subtext;
  return (
    <Card
      hover={Boolean(onClick)}
      padding="md"
      onClick={onClick}
      className={`relative overflow-hidden ${onClick ? "cursor-pointer" : ""} ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-warm-gray font-body truncate">
            {displayLabel}
          </p>
          <div className="mt-2 text-2xl md:text-3xl font-bold font-serif text-charcoal tracking-tight">
            {value}
          </div>
          {displaySubtext && (
            <p className="mt-1 text-xs text-warm-gray font-body truncate">
              {displaySubtext}
            </p>
          )}
        </div>

        {icon && (
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-forest-tint text-forest border border-forest/10">
            {icon}
          </div>
        )}
      </div>

      {trend && (
        <div className="mt-3 pt-2.5 border-t border-warm-border-light flex items-center gap-1.5 text-[11px] font-medium text-forest font-body">
          <span>{trend}</span>
        </div>
      )}
    </Card>
  );
};
