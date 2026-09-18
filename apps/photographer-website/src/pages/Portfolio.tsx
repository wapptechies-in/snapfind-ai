import { useState } from "react";
import PlaceholderPhoto from "../components/PlaceholderPhoto";

type Category = "All" | "Weddings" | "Events" | "Portraits";

const categories: Category[] = ["All", "Weddings", "Events", "Portraits"];

const work: {
  label: string;
  category: Exclude<Category, "All">;
  ratio: "portrait" | "landscape" | "square";
  tone: "warm" | "cool" | "neutral";
}[] = [
  { label: "Hartwell autumn wedding", category: "Weddings", ratio: "landscape", tone: "warm" },
  { label: "Founder portrait, downtown studio", category: "Portraits", ratio: "portrait", tone: "cool" },
  { label: "Northline product launch", category: "Events", ratio: "landscape", tone: "neutral" },
  { label: "Vineyard ceremony, golden hour", category: "Weddings", ratio: "portrait", tone: "warm" },
  { label: "Family session, coastal light", category: "Portraits", ratio: "square", tone: "warm" },
  { label: "Annual gala, grand hall", category: "Events", ratio: "landscape", tone: "cool" },
  { label: "First dance, marquee reception", category: "Weddings", ratio: "landscape", tone: "neutral" },
  { label: "Editorial headshots", category: "Portraits", ratio: "portrait", tone: "neutral" },
  { label: "Conference keynote", category: "Events", ratio: "square", tone: "cool" },
];

export default function Portfolio() {
  const [active, setActive] = useState<Category>("All");
  const filtered = active === "All" ? work : work.filter((w) => w.category === active);

  return (
    <div className="container-page py-20 md:py-28">
      <p className="text-sm font-medium tracking-wide text-blue-light uppercase">Portfolio</p>
      <h1 className="mt-4 font-display text-4xl text-white md:text-5xl">Selected work</h1>

      <div className="mt-10 flex flex-wrap gap-3 border-b border-hairline pb-8">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            className={`rounded-full border px-5 py-2 text-sm font-medium transition-all ${
              active === cat
                ? "border-blue bg-blue text-white shadow-md shadow-blue/20"
                : "border-hairline bg-black text-muted hover:border-blue hover:text-white"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="mt-10 columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4">
        {filtered.map((item) => (
          <PlaceholderPhoto
            key={item.label}
            label={item.label}
            ratio={item.ratio}
            tone={item.tone}
            className="break-inside-avoid rounded-sm shadow-lg shadow-black/40"
          />
        ))}
      </div>
    </div>
  );
}
