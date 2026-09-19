import { useState, type FormEvent } from "react";
import SEO from "../components/common/SEO";
import PlaceholderPhoto from "../components/common/PlaceholderPhoto";
import { siteConfig } from "../config/siteConfig";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Errors = { name?: string; email?: string; message?: string };

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  const whatsappUrl = `https://wa.me/${siteConfig.whatsapp.replace(/[^\d]/g, "")}`;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const nextErrors: Errors = {};
    if (!form.name.trim()) nextErrors.name = "Name is required.";
    if (!form.email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!EMAIL_RE.test(form.email)) {
      nextErrors.email = "Enter a valid email address.";
    }
    if (!form.message.trim() || form.message.trim().length < 10) {
      nextErrors.message = "Message should be at least 10 characters.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) {
      // MOCK: no backend endpoint wired up yet — this just simulates success.
      setSubmitted(true);
    }
  }

  return (
    <div className="container-page py-20 md:py-28">
      <SEO title="Contact" description="Get in touch by phone, email, WhatsApp, or the contact form." />

      <div className="grid gap-16 lg:grid-cols-2">
        <div>
          <p className="text-sm tracking-wide text-brass-light">Contact</p>
          <h1 className="mt-4 font-display text-4xl leading-tight text-ivory md:text-5xl">
            Tell us about your day.
          </h1>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-muted">
            For bookings, use the dedicated{" "}
            <a href="/booking" className="text-brass-light hover:text-brass">
              booking page
            </a>
            . For everything else, reach us directly below.
          </p>

          <div className="mt-10 space-y-4 text-sm text-muted">
            <div>
              <span className="block text-ivory">Phone</span>
              <a href={`tel:${siteConfig.phone.replace(/[^\d+]/g, "")}`} className="hover:text-ivory">
                {siteConfig.phone}
              </a>
            </div>
            <div>
              <span className="block text-ivory">Email</span>
              <a href={`mailto:${siteConfig.email}`} className="hover:text-ivory">
                {siteConfig.email}
              </a>
            </div>
            <div>
              <span className="block text-ivory">Based in</span>
              {siteConfig.address}
            </div>
            <div>
              <span className="block text-ivory">Social</span>
              <div className="mt-1 flex gap-4">
                <a href={siteConfig.social.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-ivory">
                  Instagram
                </a>
                <a href={siteConfig.social.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-ivory">
                  Facebook
                </a>
                <a href={siteConfig.social.youtube} target="_blank" rel="noopener noreferrer" className="hover:text-ivory">
                  YouTube
                </a>
              </div>
            </div>
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-brass px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-brass-light"
          >
            Message us on WhatsApp
          </a>

          <div className="mt-10">
            <PlaceholderPhoto
              label="Map — location placeholder"
              alt="Map placeholder showing the studio's general area"
              ratio="landscape"
              tone="neutral"
              className="rounded-lg"
            />
          </div>
        </div>

        <div className="rounded-xl border border-hairline bg-panel p-8">
          {submitted ? (
            <div className="flex h-full flex-col items-center justify-center py-16 text-center">
              <p className="font-display text-2xl text-ivory">Message sent.</p>
              <p className="mt-3 max-w-xs text-sm text-muted">
                This is a mock confirmation — form submissions aren't wired
                to a backend yet (Phase 2).
              </p>
              <button
                onClick={() => {
                  setForm({ name: "", email: "", message: "" });
                  setSubmitted(false);
                }}
                className="mt-6 text-sm text-brass-light hover:text-brass"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div>
                <label className="block text-xs text-muted" htmlFor="name">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  aria-invalid={!!errors.name}
                  className="mt-2 w-full rounded-md border border-hairline bg-ink px-4 py-3 text-sm text-ivory outline-none focus:border-brass"
                />
                {errors.name && <p className="mt-1.5 text-xs text-red-300">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-xs text-muted" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  aria-invalid={!!errors.email}
                  className="mt-2 w-full rounded-md border border-hairline bg-ink px-4 py-3 text-sm text-ivory outline-none focus:border-brass"
                />
                {errors.email && <p className="mt-1.5 text-xs text-red-300">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-xs text-muted" htmlFor="message">
                  Message
                </label>
                <textarea
                  id="message"
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  aria-invalid={!!errors.message}
                  className="mt-2 w-full resize-none rounded-md border border-hairline bg-ink px-4 py-3 text-sm text-ivory outline-none focus:border-brass"
                  placeholder="What are you looking for?"
                />
                {errors.message && <p className="mt-1.5 text-xs text-red-300">{errors.message}</p>}
              </div>
              <button
                type="submit"
                className="w-full rounded-full bg-brass px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-brass-light"
              >
                Send message
              </button>
              <p className="text-center text-[11px] text-muted">
                MOCK form — not yet connected to the backend.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
