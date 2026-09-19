import { categories } from "../../data/categories";

const filterOptions = [{ slug: "all", name: "All" }, ...categories];

export default function PortfolioFilter({
  active,
  onChange,
}: {
  active: string;
  onChange: (slug: string) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Filter portfolio by category"
      className="flex flex-wrap gap-3 border-b border-hairline pb-8"
    >
      {filterOptions.map((opt) => (
        <button
          key={opt.slug}
          role="tab"
          aria-selected={active === opt.slug}
          onClick={() => onChange(opt.slug)}
          className={`rounded-full border px-5 py-2 text-sm transition-colors ${
            active === opt.slug
              ? "border-brass bg-brass text-ink"
              : "border-hairline text-muted hover:border-brass hover:text-ivory"
          }`}
        >
          {opt.name}
        </button>
      ))}
    </div>
  );
}
