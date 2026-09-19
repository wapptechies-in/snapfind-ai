import PlaceholderPhoto from "../common/PlaceholderPhoto";
import type { PortfolioItem } from "../../data/portfolio";

export default function PortfolioCard({
  item,
  onOpen,
}: {
  item: PortfolioItem;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group block w-full break-inside-avoid overflow-hidden rounded-sm text-left"
      aria-label={`Open ${item.title} in full screen`}
    >
      <div className="relative">
        <PlaceholderPhoto
          label={item.title}
          alt={item.alt}
          ratio={item.ratio}
          tone={item.tone}
          src={item.src}
          className="transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <div className="pointer-events-none absolute inset-0 bg-ink/0 transition-colors duration-300 group-hover:bg-ink/20" />
        <span className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-ink/85 to-transparent p-4 text-xs text-ivory opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          {item.title}
        </span>
      </div>
    </button>
  );
}
