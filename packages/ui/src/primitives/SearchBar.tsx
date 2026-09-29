import React from "react";

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onSearch?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = "Search people, events, moments...",
  className = "",
  onSearch,
}) => {
  return (
    <div className={`relative flex items-center ${className}`}>
      <span className="absolute left-3.5 text-[#D6A84F] pointer-events-none flex items-center">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && onSearch) onSearch();
        }}
        placeholder={placeholder}
        className="w-full rounded-xl border border-[#232F48] bg-[#0F1624] pl-10 pr-9 py-2 text-xs md:text-sm text-[#F7F5F0] placeholder-[#6E788B] outline-none transition-all duration-150 focus:border-[#D6A84F] focus:ring-1 focus:ring-[#D6A84F]/40 shadow-sm font-sans"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2.5 p-1 text-xs text-[#A8B0BE] hover:text-[#F7F5F0] transition-colors"
          aria-label="Clear search"
        >
          ✕
        </button>
      )}
    </div>
  );
};
