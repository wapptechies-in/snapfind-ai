import { Link } from "react-router-dom";

export default function CTASection() {
  return (
    <section className="container-page py-24">
      <div className="rounded-2xl border border-hairline bg-panel px-8 py-16 text-center md:px-16">
        <h2 className="mx-auto max-w-xl font-display text-3xl leading-tight text-ivory md:text-4xl">
          Have a date in mind? Let's talk about your day.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-sm text-muted">
          Tell us the details and we'll follow up within one business day
          to confirm availability.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            to="/booking"
            className="rounded-full bg-brass px-7 py-3 text-sm font-medium text-ink transition-colors hover:bg-brass-light"
          >
            Book a Shoot
          </Link>
          <Link
            to="/contact"
            className="rounded-full border border-hairline px-7 py-3 text-sm text-ivory transition-colors hover:border-brass"
          >
            Ask a question
          </Link>
        </div>
      </div>
    </section>
  );
}
