import { Link } from "react-router-dom";
import PlaceholderPhoto from "../common/PlaceholderPhoto";
import { siteConfig } from "../../config/siteConfig";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <PlaceholderPhoto
          label="Cinematic hero image"
          alt="Cinematic photography hero background"
          ratio="landscape"
          tone="warm"
          priority
          className="h-full w-full"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/20" />
      </div>

      <div className="container-page relative flex min-h-[92vh] flex-col justify-end pb-20 pt-40 md:min-h-[88vh]">
        <h1 className="max-w-2xl font-display text-5xl leading-[1.05] text-ivory md:text-7xl">
          {siteConfig.tagline}
        </h1>
        <p className="mt-6 max-w-md text-base leading-relaxed text-muted">
          Wedding, sports, events and candid photography crafted to
          preserve the moments that matter.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            to="/portfolio"
            className="rounded-full bg-brass px-7 py-3 text-sm font-medium text-ink transition-colors hover:bg-brass-light"
          >
            Explore Portfolio
          </Link>
          <Link
            to="/booking"
            className="rounded-full border border-ivory/30 px-7 py-3 text-sm text-ivory transition-colors hover:border-brass"
          >
            Book a Shoot
          </Link>
        </div>
      </div>
    </section>
  );
}
