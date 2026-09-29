import React from "react";

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = "",
}) => {
  return (
    <div className={`flex items-center gap-1 border-b border-[#232F48] overflow-x-auto ${className}`}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              isActive
                ? "border-[#D6A84F] text-[#D6A84F] font-bold"
                : "border-transparent text-[#A8B0BE] hover:text-[#F7F5F0] hover:border-[#232F48]"
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-mono ${
                  isActive ? "bg-[#D6A84F]/20 text-[#D6A84F] font-bold" : "bg-[#151D2E] text-[#A8B0BE] border border-[#232F48]"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
