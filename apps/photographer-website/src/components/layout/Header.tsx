import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { siteConfig } from "../../config/siteConfig";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll while the mobile menu is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const findMyPhotosIsExternal = siteConfig.findMyPhotosUrl.startsWith("http");

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled || open ? "bg-ink/90 backdrop-blur-md border-b border-hairline" : "bg-transparent"
      }`}
    >
      <div className="container-page flex h-20 items-center justify-between">
        <NavLink to="/" className="flex flex-col leading-none" onClick={() => setOpen(false)}>
          <span className="font-display text-xl tracking-wide text-ivory">{siteConfig.logoText}</span>
          <span className="mt-0.5 text-[11px] text-muted">Photography</span>
        </NavLink>

        <nav aria-label="Primary" className="hidden items-center gap-9 lg:flex">
          {siteConfig.nav.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                `text-sm transition-colors ${
                  isActive ? "text-brass-light" : "text-ivory/80 hover:text-ivory"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
          <a
            href={siteConfig.findMyPhotosUrl}
            target={findMyPhotosIsExternal ? "_blank" : undefined}
            rel={findMyPhotosIsExternal ? "noopener noreferrer" : undefined}
            className="rounded-full border border-brass px-5 py-2 text-sm text-brass-light transition-colors hover:bg-brass hover:text-ink"
          >
            Find My Photos
          </a>
        </nav>

        <button
          className="flex flex-col gap-1.5 lg:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span className={`h-px w-6 bg-ivory transition-transform ${open ? "translate-y-[7px] rotate-45" : ""}`} />
          <span className={`h-px w-6 bg-ivory transition-opacity ${open ? "opacity-0" : ""}`} />
          <span className={`h-px w-6 bg-ivory transition-transform ${open ? "-translate-y-[7px] -rotate-45" : ""}`} />
        </button>
      </div>

      {open && (
        <nav id="mobile-menu" aria-label="Mobile" className="border-t border-hairline bg-ink lg:hidden">
          <div className="container-page flex flex-col gap-1 py-4">
            {siteConfig.nav.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className="py-3 text-ivory/90"
              >
                {link.label}
              </NavLink>
            ))}
            <a
              href={siteConfig.findMyPhotosUrl}
              target={findMyPhotosIsExternal ? "_blank" : undefined}
              rel={findMyPhotosIsExternal ? "noopener noreferrer" : undefined}
              onClick={() => setOpen(false)}
              className="mt-2 rounded-full border border-brass px-5 py-3 text-center text-sm text-brass-light"
            >
              Find My Photos
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
