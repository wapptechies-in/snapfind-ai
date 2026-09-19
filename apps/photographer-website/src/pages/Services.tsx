import { Link } from "react-router-dom";
import SEO from "../components/common/SEO";
import ServiceCard from "../components/services/ServiceCard";
import { services } from "../data/services";

export default function Services() {
  return (
    <div className="container-page py-20 md:py-28">
      <SEO
        title="Services"
        description="Wedding, event, sports, birthday, candid, family, corporate, and portrait photography services."
      />

      <p className="text-sm tracking-wide text-brass-light">Services</p>
      <h1 className="mt-4 max-w-2xl font-display text-4xl leading-tight text-ivory md:text-5xl">
        Photography for every kind of moment.
      </h1>
      <p className="mt-6 max-w-xl text-sm leading-relaxed text-muted">
        Every package is tailored to the event — get in touch with your
        date and details, and we'll put together pricing that fits.
        There's no fixed price list here; enquire and we'll follow up
        directly.
      </p>

      <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <ServiceCard key={service.slug} service={service} />
        ))}
      </div>

      <div className="mt-16 flex flex-col items-center gap-4 rounded-xl border border-hairline bg-panel p-10 text-center">
        <p className="max-w-md text-sm text-muted">
          Not sure which service fits your event? Send an enquiry with a
          few details and we'll recommend the right coverage.
        </p>
        <Link
          to="/booking"
          className="rounded-full bg-brass px-7 py-3 text-sm font-medium text-ink transition-colors hover:bg-brass-light"
        >
          Send an enquiry
        </Link>
      </div>
    </div>
  );
}
