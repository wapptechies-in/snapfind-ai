import React from "react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs,
  actions,
  className = "",
}) => {
  return (
    <div className={`mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${className}`}>
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="mb-1.5 flex items-center gap-1.5 text-xs text-[#A8B0BE]">
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <React.Fragment key={crumb.label}>
                  {idx > 0 && <span className="text-[#232F48]">/</span>}
                  {isLast || (!crumb.href && !crumb.onClick) ? (
                    <span className="font-medium text-[#F7F5F0]">{crumb.label}</span>
                  ) : (
                    <button
                      type="button"
                      onClick={crumb.onClick}
                      className="hover:text-[#D6A84F] transition-colors underline-offset-2 hover:underline cursor-pointer"
                    >
                      {crumb.label}
                    </button>
                  )}
                </React.Fragment>
              );
            })}
          </nav>
        )}

        <h1 className="font-sans text-2xl md:text-3xl font-bold tracking-tight text-[#F7F5F0]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-xs md:text-sm text-[#A8B0BE] font-sans leading-relaxed max-w-2xl">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {actions}
        </div>
      )}
    </div>
  );
};
