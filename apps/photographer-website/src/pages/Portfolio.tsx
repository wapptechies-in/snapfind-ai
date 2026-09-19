import { useSearchParams } from "react-router-dom";
import SEO from "../components/common/SEO";
import PortfolioGrid from "../components/portfolio/PortfolioGrid";
import { categories } from "../data/categories";

export default function Portfolio() {
  const [searchParams] = useSearchParams();
  const requestedCategory = searchParams.get("category");
  const initialCategory =
    requestedCategory && categories.some((c) => c.slug === requestedCategory)
      ? requestedCategory
      : "all";

  return (
    <div className="container-page py-20 md:py-28">
      <SEO
        title="Portfolio"
        description="Browse wedding, event, sports, and portrait photography by category."
      />

      <p className="text-sm tracking-wide text-brass-light">Portfolio</p>
      <h1 className="mt-4 font-display text-4xl text-ivory md:text-5xl">Selected work</h1>
      <p className="mt-4 max-w-lg text-sm text-muted">
        Filter by category, or click any photo for a full-screen view.
      </p>

      {/* key forces the grid to re-read the initial category if the
          user arrives via a different ?category= link */}
      <div className="mt-10">
        <PortfolioGrid key={initialCategory} initialCategory={initialCategory} />
      </div>
    </div>
  );
}
