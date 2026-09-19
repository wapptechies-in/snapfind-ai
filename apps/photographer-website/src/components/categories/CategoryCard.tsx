import { Link } from "react-router-dom";
import PlaceholderPhoto from "../common/PlaceholderPhoto";
import type { Category } from "../../data/categories";

export default function CategoryCard({ category }: { category: Category }) {
  return (
    <Link
      to={`/portfolio?category=${category.slug}`}
      className="group relative block overflow-hidden rounded-sm"
    >
      <PlaceholderPhoto
        label={category.name}
        alt={`${category.name} photography`}
        ratio="square"
        tone={category.tone}
        className="transition-transform duration-500 group-hover:scale-[1.04]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5">
        <h3 className="font-display text-lg text-ivory">{category.name}</h3>
        <p className="mt-1 text-xs leading-relaxed text-ivory/70 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          {category.description}
        </p>
      </div>
    </Link>
  );
}
