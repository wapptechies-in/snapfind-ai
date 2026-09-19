import { useMemo, useState } from "react";
import { portfolioItems } from "../../data/portfolio";
import PortfolioFilter from "./PortfolioFilter";
import PortfolioCard from "./PortfolioCard";
import Lightbox from "./Lightbox";

export default function PortfolioGrid({ initialCategory = "all" }: { initialCategory?: string }) {
  const [active, setActive] = useState(initialCategory);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const filtered = useMemo(
    () => (active === "all" ? portfolioItems : portfolioItems.filter((p) => p.category === active)),
    [active]
  );

  return (
    <div>
      <PortfolioFilter active={active} onChange={setActive} />

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted">No photos in this category yet.</p>
      ) : (
        <div className="mt-10 columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4">
          {filtered.map((item, i) => (
            <PortfolioCard key={item.id} item={item} onOpen={() => setLightboxIndex(i)} />
          ))}
        </div>
      )}

      {lightboxIndex !== null && (
        <Lightbox
          items={filtered}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </div>
  );
}
