/**
 * Stands in for a real photograph until the photographer uploads their own
 * work. Renders a sleek modern blue/black/white gradient field with a frame-corner mark
 * and a small caption, rather than a broken <img> tag — this keeps the layout
 * looking intentional while real assets are still MOCK.
 */
type Props = {
  label: string;
  ratio?: "portrait" | "landscape" | "square";
  tone?: "warm" | "cool" | "neutral";
  className?: string;
};

const ratioClass: Record<NonNullable<Props["ratio"]>, string> = {
  portrait: "aspect-[3/4]",
  landscape: "aspect-[3/2]",
  square: "aspect-square",
};

const toneClass: Record<NonNullable<Props["tone"]>, string> = {
  warm: "from-[#0F224A] via-[#0A1329] to-[#000000]",
  cool: "from-[#132A52] via-[#0B1526] to-[#000000]",
  neutral: "from-[#1E293B] via-[#0F172A] to-[#000000]",
};

export default function PlaceholderPhoto({
  label,
  ratio = "landscape",
  tone = "neutral",
  className = "",
}: Props) {
  return (
    <div
      className={`group relative overflow-hidden bg-panel border border-hairline/60 ${ratioClass[ratio]} ${className}`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${toneClass[tone]}`} />
      <div className="absolute inset-0 opacity-[0.2] mix-blend-overlay [background-image:radial-gradient(circle_at_30%_20%,#60A5FA,transparent_50%)]" />
      <span className="absolute left-4 top-4 h-6 w-6 border-l border-t border-blue/60 transition-colors group-hover:border-blue-light" />
      <span className="absolute bottom-4 right-4 h-6 w-6 border-b border-r border-blue/60 transition-colors group-hover:border-blue-light" />
      <span className="absolute inset-x-0 bottom-4 text-center font-display text-xs italic tracking-wide text-white/60 group-hover:text-blue-light transition-colors">
        {label}
      </span>
    </div>
  );
}
