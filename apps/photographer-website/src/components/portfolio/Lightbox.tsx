import { useEffect, useRef } from "react";
import type { PortfolioItem } from "../../data/portfolio";
import PlaceholderPhoto from "../common/PlaceholderPhoto";

type Props = {
  items: PortfolioItem[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
};

export default function Lightbox({ items, index, onClose, onNavigate }: Props) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const item = items[index];

  useEffect(() => {
    closeButtonRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNavigate((index + 1) % items.length);
      if (e.key === "ArrowLeft") onNavigate((index - 1 + items.length) % items.length);
    }

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [index, items.length, onClose, onNavigate]);

  if (!item) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${item.title} — full screen view`}
      className="fixed inset-0 z-[100] flex flex-col bg-ink/97 backdrop-blur-sm animate-fadeIn motion-reduce:animate-none"
    >
      <div className="flex items-center justify-between px-5 py-4 text-ivory md:px-8">
        <span className="text-sm text-muted">
          {index + 1} / {items.length}
        </span>
        <button
          ref={closeButtonRef}
          onClick={onClose}
          aria-label="Close full screen view"
          className="rounded-full border border-hairline p-2 hover:border-brass"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center px-4 pb-6 md:px-16">
        <button
          onClick={() => onNavigate((index - 1 + items.length) % items.length)}
          aria-label="Previous photo"
          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full border border-hairline p-2 text-ivory hover:border-brass md:left-6"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </button>

        <div className="max-h-full w-full max-w-3xl">
          <PlaceholderPhoto
            label={item.title}
            alt={item.alt}
            src={item.src}
            ratio={item.ratio}
            tone={item.tone}
            priority
            className="max-h-[70vh] rounded-sm"
          />
          <p className="mt-4 text-center text-sm text-ivory/80">{item.title}</p>
        </div>

        <button
          onClick={() => onNavigate((index + 1) % items.length)}
          aria-label="Next photo"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-hairline p-2 text-ivory hover:border-brass md:right-6"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
