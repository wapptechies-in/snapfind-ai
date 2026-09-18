import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-hairline bg-panel">
      <div className="container-page grid gap-10 py-16 md:grid-cols-3">
        <div>
          <span className="font-display text-lg text-white">Marlowe &amp; Finch</span>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
            Documentary-style event and portrait photography. Every gallery
            is delivered through <span className="text-blue-light">SnapFind AI</span>, so your photos find you.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">Studio</h3>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            <li>
              <Link to="/portfolio" className="transition-colors hover:text-white">Portfolio</Link>
            </li>
            <li>
              <Link to="/services" className="transition-colors hover:text-white">Services &amp; pricing</Link>
            </li>
            <li>
              <Link to="/about" className="transition-colors hover:text-white">About</Link>
            </li>
            <li>
              <Link to="/booking" className="transition-colors hover:text-white">Book a session</Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">Find your photos</h3>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Attended an event we shot? Your gallery lives on SnapFind AI —
            search it with a selfie or scan the QR code from the event.
          </p>
          <a
            href="#"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-blue-light hover:text-blue transition-colors"
          >
            Go to SnapFind AI <span>→</span>
          </a>
        </div>
      </div>

      <div className="border-t border-hairline">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-muted md:flex-row md:items-center md:justify-between">
          <span>© {new Date().getFullYear()} Marlowe &amp; Finch Photography. All rights reserved.</span>
          <span className="text-white/60">Built on <span className="text-blue-light font-medium">SnapFind AI</span> — Scan. Find. Relive.</span>
        </div>
      </div>
    </footer>
  );
}
