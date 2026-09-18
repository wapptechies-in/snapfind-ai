import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Home" },
  { to: "/portfolio", label: "Portfolio" },
  { to: "/services", label: "Services" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled ? "bg-black/90 backdrop-blur-md border-b border-hairline" : "bg-transparent"
      }`}
    >
      <div className="container-page flex h-20 items-center justify-between">
        <NavLink to="/" className="flex flex-col leading-none" onClick={() => setOpen(false)}>
          <span className="font-display text-xl tracking-wide text-white">Marlowe &amp; Finch</span>
          <span className="mt-0.5 text-[11px] text-muted">
            Photography · powered by <span className="text-blue-light">SnapFind AI</span>
          </span>
        </NavLink>

        <nav className="hidden items-center gap-10 md:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `text-sm transition-colors ${
                  isActive ? "text-blue-light font-medium" : "text-white/80 hover:text-white"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
          <NavLink
            to="/booking"
            className="rounded-full border border-blue bg-blue/10 px-5 py-2 text-sm text-blue-light transition-all hover:bg-blue hover:text-white hover:shadow-md hover:shadow-blue/25"
          >
            Book a session
          </NavLink>
        </nav>

        <button
          className="flex flex-col gap-1.5 md:hidden"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className={`h-px w-6 bg-white transition-transform ${open ? "translate-y-[7px] rotate-45" : ""}`} />
          <span className={`h-px w-6 bg-white transition-opacity ${open ? "opacity-0" : ""}`} />
          <span className={`h-px w-6 bg-white transition-transform ${open ? "-translate-y-[7px] -rotate-45" : ""}`} />
        </button>
      </div>

      {open && (
        <nav className="border-t border-hairline bg-black md:hidden">
          <div className="container-page flex flex-col gap-1 py-4">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `py-3 text-sm transition-colors ${isActive ? "text-blue-light font-medium" : "text-white/90"}`
                }
              >
                {link.label}
              </NavLink>
            ))}
            <NavLink
              to="/booking"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-full border border-blue bg-blue px-5 py-3 text-center text-sm font-medium text-white"
            >
              Book a session
            </NavLink>
          </div>
        </nav>
      )}
    </header>
  );
}
