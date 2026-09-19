/**
 * Renders a portfolio/hero image. Pass `src` + `alt` once a real
 * photograph is available and it renders a real, lazy-loaded <img>.
 * Without `src`, it falls back to a styled gradient placeholder so the
 * layout still looks intentional — this is what lets a real client's
 * photos replace placeholders later by only editing `src/data/*.ts`.
 */
type Props = {
  label: string;
  alt?: string;
  src?: string;
  ratio?: "portrait" | "landscape" | "square";
  tone?: "warm" | "cool" | "neutral";
  className?: string;
  priority?: boolean; // true for above-the-fold images (hero) — skips lazy loading
};

const ratioClass: Record<NonNullable<Props["ratio"]>, string> = {
  portrait: "aspect-[3/4]",
  landscape: "aspect-[3/2]",
  square: "aspect-square",
};

const toneClass: Record<NonNullable<Props["tone"]>, string> = {
  warm: "from-[#2A2117] via-[#171512] to-[#0B0C0E]",
  cool: "from-[#171A1C] via-[#131416] to-[#0B0C0E]",
  neutral: "from-[#1B1B1B] via-[#141414] to-[#0B0C0E]",
};

export default function PlaceholderPhoto({
  label,
  alt,
  src,
  ratio = "landscape",
  tone = "neutral",
  className = "",
  priority = false,
}: Props) {
  if (src) {
    return (
      <div className={`overflow-hidden bg-panel ${ratioClass[ratio]} ${className}`}>
        <img
          src={src}
          alt={alt ?? label}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={alt ?? label}
      className={`group relative overflow-hidden bg-panel ${ratioClass[ratio]} ${className}`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${toneClass[tone]}`} />
      <div className="absolute inset-0 opacity-[0.15] mix-blend-overlay [background-image:radial-gradient(circle_at_30%_20%,#fff,transparent_40%)]" />
      <span className="absolute left-4 top-4 h-6 w-6 border-l border-t border-brass/40" />
      <span className="absolute bottom-4 right-4 h-6 w-6 border-b border-r border-brass/40" />
      <span className="absolute inset-x-0 bottom-4 text-center font-display text-xs italic tracking-wide text-ivory/40">
        {label}
      </span>
    </div>
  );
}
