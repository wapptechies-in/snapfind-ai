import { Link } from "react-router-dom";

const packages = [
  {
    name: "Portrait session",
    price: "$450",
    unit: "per session",
    description: "Individuals, couples, or families. One location, natural light.",
    features: [
      "60-minute session",
      "One location",
      "30+ edited images",
      "Private online gallery via SnapFind AI",
      "Delivery within 5 days",
    ],
  },
  {
    name: "Event coverage",
    price: "$1,200",
    unit: "per event",
    description: "Launches, galas, conferences — up to 4 hours on site.",
    features: [
      "Up to 4 hours coverage",
      "150+ edited images",
      "QR-code gallery for all guests",
      "Selfie search via SnapFind AI",
      "Delivery within 48 hours",
    ],
    featured: true,
  },
  {
    name: "Wedding day",
    price: "From $3,200",
    unit: "full day",
    description: "Getting-ready through last dance, second shooter available.",
    features: [
      "Up to 10 hours coverage",
      "400+ edited images",
      "Guest gallery with selfie search",
      "Optional second shooter",
      "Delivery within 3 weeks",
    ],
  },
];

export default function Services() {
  return (
    <div className="container-page py-20 md:py-28">
      <p className="text-sm font-medium tracking-wide text-blue-light uppercase">Services &amp; pricing</p>
      <h1 className="mt-4 max-w-2xl font-display text-4xl leading-tight text-white md:text-5xl">
        Straightforward packages. Every gallery ships on SnapFind AI.
      </h1>
      <p className="mt-6 max-w-xl text-sm leading-relaxed text-muted">
        Need something custom — multi-day coverage, a brand shoot, a
        recurring event series? Get in touch and we'll put together a
        package that fits.
      </p>

      <div className="mt-16 grid gap-6 lg:grid-cols-3">
        {packages.map((pkg) => (
          <div
            key={pkg.name}
            className={`flex flex-col rounded-xl border p-8 transition-all ${
              pkg.featured
                ? "border-blue bg-panel shadow-xl shadow-blue/10"
                : "border-hairline bg-panel/60 hover:border-hairline-light"
            }`}
          >
            {pkg.featured && (
              <span className="mb-4 inline-block w-fit rounded-full bg-blue px-3 py-1 text-[11px] font-semibold text-white">
                Most booked
              </span>
            )}
            <h2 className="font-display text-2xl text-white">{pkg.name}</h2>
            <p className="mt-2 text-sm text-muted">{pkg.description}</p>
            <div className="mt-6 flex items-baseline gap-2">
              <span className="font-display text-3xl text-white">{pkg.price}</span>
              <span className="text-xs text-muted">{pkg.unit}</span>
            </div>
            <ul className="mt-6 flex-1 space-y-3 text-sm text-muted">
              {pkg.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <span className="text-blue-light font-bold">·</span>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              to="/booking"
              className={`mt-8 rounded-full px-6 py-3 text-center text-sm font-medium transition-all ${
                pkg.featured
                  ? "bg-blue text-white shadow-md shadow-blue/20 hover:bg-blue-hover"
                  : "border border-hairline bg-black text-white hover:border-blue hover:text-blue-light"
              }`}
            >
              Book this package
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
