import { Link } from "react-router-dom";
import SEO from "../components/common/SEO";
import Hero from "../components/hero/Hero";
import CategoryCard from "../components/categories/CategoryCard";
import PlaceholderPhoto from "../components/common/PlaceholderPhoto";
import ServiceCard from "../components/services/ServiceCard";
import WhyChooseUs from "../components/common/WhyChooseUs";
import CTASection from "../components/common/CTASection";
import { featuredCategories } from "../data/categories";
import { featuredPortfolioItems } from "../data/portfolio";
import { featuredServices } from "../data/services";
import { siteConfig } from "../config/siteConfig";

export default function Home() {
  return (
    <>
      <SEO
        title="Home"
        description={siteConfig.seo.defaultDescription}
      />

      {/* HERO */}
      <Hero />

      {/* INTRODUCTION */}
      <section className="container-page py-24 text-center">
        <p className="text-sm tracking-wide text-brass-light">Welcome</p>
        <h2 className="mx-auto mt-4 max-w-2xl font-display text-3xl leading-snug text-ivory md:text-4xl">
          {siteConfig.photographerName} photographs weddings, events, sports,
          and portraits — with a documentary eye for the moment as it
          actually happens.
        </h2>
        <p className="mx-auto mt-6 max-w-lg text-sm leading-relaxed text-muted">
          Every gallery is delivered through SnapFind AI, so the people in
          your photos can find and download them in seconds — no endless
          scrolling required.
        </p>
      </section>

      {/* PHOTOGRAPHY CATEGORIES */}
      <section className="container-page pb-24">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-3xl text-ivory">Photography for every occasion</h2>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
          {featuredCategories.map((cat) => (
            <CategoryCard key={cat.slug} category={cat} />
          ))}
        </div>
      </section>

      {/* FEATURED PORTFOLIO */}
      <section className="container-page pb-24">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-3xl text-ivory">Featured work</h2>
          <Link to="/portfolio" className="text-sm text-brass-light hover:text-brass">
            Full portfolio →
          </Link>
        </div>
        <div className="mt-10 columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4">
          {featuredPortfolioItems.slice(0, 6).map((item) => (
            <Link
              key={item.id}
              to={`/portfolio?category=${item.category}`}
              className="group block break-inside-avoid overflow-hidden rounded-sm"
            >
              <PlaceholderPhoto
                label={item.title}
                alt={item.alt}
                ratio={item.ratio}
                tone={item.tone}
                src={item.src}
                className="transition-transform duration-500 group-hover:scale-[1.03]"
              />
            </Link>
          ))}
        </div>
      </section>

      {/* ABOUT PHOTOGRAPHER (teaser) */}
      <section className="border-y border-hairline bg-panel/40">
        <div className="container-page grid gap-10 py-20 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-sm tracking-wide text-brass-light">About {siteConfig.photographerName}</p>
            <h2 className="mt-4 font-display text-3xl leading-tight text-ivory md:text-4xl">
              Photographing the parts of the day people actually remember.
            </h2>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-muted">
              A documentary approach to wedding, event, and portrait
              photography — staying out of the way, and bringing back the
              day as it happened.
            </p>
            <Link
              to="/about"
              className="mt-6 inline-flex items-center gap-1 text-sm text-ivory hover:text-brass-light"
            >
              Read more <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* SERVICES (teaser) */}
      <section className="container-page py-24">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-3xl text-ivory">Services</h2>
          <Link to="/services" className="text-sm text-brass-light hover:text-brass">
            All services →
          </Link>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featuredServices.map((service) => (
            <ServiceCard key={service.slug} service={service} />
          ))}
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <WhyChooseUs />

      {/* CALL TO ACTION + CONTACT/BOOKING */}
      <CTASection />
    </>
  );
}
