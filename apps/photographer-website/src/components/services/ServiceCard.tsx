import { Link } from "react-router-dom";
import type { Service } from "../../data/services";

export default function ServiceCard({ service }: { service: Service }) {
  return (
    <div className="flex flex-col rounded-xl border border-hairline bg-panel/50 p-7">
      <h3 className="font-display text-xl text-ivory">{service.title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-muted">{service.description}</p>
      <p className="mt-4 text-xs text-brass-light">Suited for: {service.suitableFor}</p>
      <Link
        to="/booking"
        className="mt-6 inline-flex w-fit items-center gap-1 text-sm text-ivory hover:text-brass-light"
      >
        Enquire now <span aria-hidden>→</span>
      </Link>
    </div>
  );
}
