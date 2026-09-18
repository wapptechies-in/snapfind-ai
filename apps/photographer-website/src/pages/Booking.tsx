import { useState } from "react";

const sessionTypes = ["Portrait session", "Event coverage", "Wedding day", "Something else"];

export default function Booking() {
  const [submitted, setSubmitted] = useState(false);
  const [sessionType, setSessionType] = useState(sessionTypes[0]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // MOCK: no backend endpoint wired up yet — this just simulates success.
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="container-page flex flex-col items-center py-32 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue/20 text-blue-light mb-4">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="font-display text-3xl text-white">Request received.</p>
        <p className="mt-4 max-w-sm text-sm text-muted">
          This is a mock confirmation for Phase 1 — booking requests aren't
          saved to a database or sent to a real calendar yet. That's
          planned for a later phase.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-8 rounded-full border border-hairline px-6 py-3 text-sm text-white hover:border-blue hover:text-blue-light transition-colors"
        >
          Start a new request
        </button>
      </div>
    );
  }

  return (
    <div className="container-page py-20 md:py-28">
      <div className="mx-auto max-w-xl">
        <p className="text-center text-sm font-medium tracking-wide text-blue-light uppercase">Booking</p>
        <h1 className="mt-4 text-center font-display text-4xl leading-tight text-white md:text-5xl">
          Let's find a date.
        </h1>
        <p className="mt-6 text-center text-sm leading-relaxed text-muted">
          Fill this out and I'll follow up within a business day to confirm
          availability and details.
        </p>

        <form onSubmit={handleSubmit} className="mt-12 space-y-6 rounded-xl border border-hairline bg-panel p-8 shadow-2xl shadow-black/40">
          <div>
            <span className="block text-xs font-medium text-muted">Session type</span>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {sessionTypes.map((type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => setSessionType(type)}
                  className={`rounded-md border px-4 py-3 text-left text-sm transition-all ${
                    sessionType === type
                      ? "border-blue bg-blue/15 text-white font-medium"
                      : "border-hairline bg-black text-muted hover:border-blue/60 hover:text-white"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-muted" htmlFor="date">
                Preferred date
              </label>
              <input
                id="date"
                type="date"
                required
                className="mt-2 w-full rounded-md border border-hairline bg-black px-4 py-3 text-sm text-white outline-none transition-colors focus:border-blue"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted" htmlFor="location">
                Location
              </label>
              <input
                id="location"
                type="text"
                required
                placeholder="City or venue"
                className="mt-2 w-full rounded-md border border-hairline bg-black px-4 py-3 text-sm text-white placeholder:text-muted/50 outline-none transition-colors focus:border-blue"
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-muted" htmlFor="bname">
                Name
              </label>
              <input
                id="bname"
                type="text"
                required
                className="mt-2 w-full rounded-md border border-hairline bg-black px-4 py-3 text-sm text-white placeholder:text-muted/50 outline-none transition-colors focus:border-blue"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted" htmlFor="bemail">
                Email
              </label>
              <input
                id="bemail"
                type="email"
                required
                className="mt-2 w-full rounded-md border border-hairline bg-black px-4 py-3 text-sm text-white placeholder:text-muted/50 outline-none transition-colors focus:border-blue"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted" htmlFor="details">
              Anything else I should know?
            </label>
            <textarea
              id="details"
              rows={4}
              className="mt-2 w-full resize-none rounded-md border border-hairline bg-black px-4 py-3 text-sm text-white placeholder:text-muted/50 outline-none transition-colors focus:border-blue"
              placeholder="Guest count, timeline, vision for the day..."
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-full bg-blue px-6 py-3 text-sm font-medium text-white shadow-lg shadow-blue/20 transition-all hover:bg-blue-hover"
          >
            Request this date
          </button>
          <p className="text-center text-[11px] text-muted">
            MOCK form — no payment, calendar, or backend integration yet.
          </p>
        </form>
      </div>
    </div>
  );
}
