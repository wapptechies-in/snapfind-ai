import { Link } from "react-router-dom";
import SEO from "../components/common/SEO";
import PlaceholderPhoto from "../components/common/PlaceholderPhoto";
import { siteConfig } from "../config/siteConfig";

export default function About() {
  return (
    <>
      <SEO
        title="About"
        description={`About ${siteConfig.photographerName} — photography philosophy, style, and approach.`}
      />

      <div className="container-page grid gap-16 py-20 md:grid-cols-2 md:items-start md:gap-14 md:py-28">
        <PlaceholderPhoto
          label="At work"
          alt={`${siteConfig.photographerName} photographing on location`}
          ratio="portrait"
          tone="cool"
          className="md:sticky md:top-28"
        />

        <div>
          <p className="text-sm tracking-wide text-brass-light">About the Photographer</p>
          <h1 className="mt-4 font-display text-4xl leading-tight text-ivory md:text-5xl">
            I photograph the parts of an event people actually remember.
          </h1>

          <div className="mt-8 space-y-5 text-[15px] leading-relaxed text-muted">
            <p>
              I'm {siteConfig.photographerName}, and this is a placeholder
              introduction — replace it with the photographer's real
              story once it's provided. The tone here is meant to stay
              warm, personal, and specific rather than generic.
            </p>
            <p>
              <strong className="text-ivory">Philosophy &amp; style.</strong>{" "}
              Documentary first: staying out of the way, and bringing back
              the day as it actually happened rather than a staged
              re-enactment of it. [Placeholder — describe the real
              approach, gear, and style here.]
            </p>
            <p>
              <strong className="text-ivory">Experience.</strong> [Placeholder
              — add real years of experience, notable work, or specialties
              once available. Nothing here is invented.]
            </p>
            <p>
              Every gallery delivered goes out through SnapFind AI, so
              guests can find their own photos with a QR code and a
              selfie search instead of scrolling through hundreds of
              frames.
            </p>
          </div>

          <div className="mt-10 flex flex-wrap gap-4 border-t border-hairline pt-8">
            <Link
              to="/booking"
              className="rounded-full bg-brass px-7 py-3 text-sm font-medium text-ink transition-colors hover:bg-brass-light"
            >
              Book a Shoot
            </Link>
            <Link
              to="/portfolio"
              className="rounded-full border border-hairline px-7 py-3 text-sm text-ivory transition-colors hover:border-brass"
            >
              View Portfolio
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
