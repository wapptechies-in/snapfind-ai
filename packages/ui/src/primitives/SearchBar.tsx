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
  placeholder = "Search events, clients, or tokens...",
  className = "",
  onSearch,
}) => {
  return (
    <div className={`relative flex items-center ${className}`}>
      <span className="absolute left-3.5 text-warm-gray pointer-events-none">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
        className="w-full rounded-xl border border-warm-border bg-white pl-9 pr-8 py-2 text-xs md:text-sm text-charcoal placeholder:text-warm-gray-light outline-none transition-all focus:border-forest focus:ring-2 focus:ring-forest/15 shadow-sm font-body"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2.5 p-1 text-xs text-warm-gray hover:text-charcoal"
          aria-label="Clear search"
        >
          ✕
        </button>
      )}
    </div>
  );
};
