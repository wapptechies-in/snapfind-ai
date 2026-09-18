import { useState } from "react";

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // MOCK: no backend endpoint wired up yet — this just simulates success.
    setSubmitted(true);
  }

  return (
    <div className="container-page py-20 md:py-28">
      <div className="grid gap-16 md:grid-cols-2">
        <div>
          <p className="text-sm font-medium tracking-wide text-blue-light uppercase">Contact</p>
          <h1 className="mt-4 font-display text-4xl leading-tight text-white md:text-5xl">
            Tell me about your day.
          </h1>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-muted">
            For bookings, use the form or the dedicated{" "}
            <a href="/booking" className="text-blue-light hover:text-blue font-medium transition-colors">
              booking page
            </a>
            . For everything else — press, collaborations, questions — the
            form here reaches me directly.
          </p>

          <div className="mt-10 space-y-4 text-sm text-muted">
            <div>
              <span className="block font-medium text-white">Email</span>
              hello@marloweandfinch.studio
            </div>
            <div>
              <span className="block font-medium text-white">Based in</span>
              Hartwell &amp; the coast — available to travel
            </div>
            <div>
              <span className="block font-medium text-white">Response time</span>
              Within one business day
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-hairline bg-panel p-8 shadow-2xl shadow-black/40">
          {submitted ? (
            <div className="flex h-full flex-col items-center justify-center py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue/20 text-blue-light mb-4">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="font-display text-2xl text-white">Message sent.</p>
              <p className="mt-3 max-w-xs text-sm text-muted">
                This is a mock confirmation — form submissions aren't wired
                to a backend yet (Phase 1).
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-6 text-sm font-medium text-blue-light hover:text-blue transition-colors"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-muted" htmlFor="name">
                  Name
                </label>
                <input
                  id="name"
                  required
                  type="text"
                  className="mt-2 w-full rounded-md border border-hairline bg-black px-4 py-3 text-sm text-white placeholder:text-muted/50 outline-none transition-colors focus:border-blue"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  required
                  type="email"
                  className="mt-2 w-full rounded-md border border-hairline bg-black px-4 py-3 text-sm text-white placeholder:text-muted/50 outline-none transition-colors focus:border-blue"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted" htmlFor="message">
                  Message
                </label>
                <textarea
                  id="message"
                  required
                  rows={5}
                  className="mt-2 w-full resize-none rounded-md border border-hairline bg-black px-4 py-3 text-sm text-white placeholder:text-muted/50 outline-none transition-colors focus:border-blue"
                  placeholder="What are you looking for?"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-full bg-blue px-6 py-3 text-sm font-medium text-white shadow-lg shadow-blue/20 transition-all hover:bg-blue-hover"
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
