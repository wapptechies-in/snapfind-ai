import { Link } from "react-router-dom";
import PlaceholderPhoto from "../components/PlaceholderPhoto";

const highlights = [
  { title: "Weddings", copy: "A full day, told in order — arrival to last dance." },
  { title: "Events", copy: "Conferences, launches, galas. Fast turnaround galleries." },
  { title: "Portraits", copy: "Individuals, families, and founders. Natural light, no rush." },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="container-page grid gap-10 pb-24 pt-16 md:grid-cols-2 md:items-end md:pt-24">
        <div>
          <p className="text-sm font-medium tracking-wide text-blue-light uppercase">
            Documentary &amp; portrait photography
          </p>
          <h1 className="mt-6 font-display text-5xl leading-[1.05] text-white md:text-6xl">
            Photographs that hold still,
            <span className="italic text-blue-light"> long after the moment moves on.</span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-muted">
            I'm a photographer based between two cities, shooting weddings,
            events, and portraits — and every gallery I deliver runs on
            <span className="text-white font-medium"> SnapFind AI</span>, so the people in the photos can actually find them.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              to="/booking"
              className="rounded-full bg-blue px-7 py-3 text-sm font-medium text-white shadow-lg shadow-blue/25 transition-all hover:bg-blue-hover"
            >
              Book a session
            </Link>
            <Link
              to="/portfolio"
              className="rounded-full border border-hairline px-7 py-3 text-sm text-white transition-colors hover:border-blue hover:text-blue-light"
            >
              View portfolio
            </Link>
          </div>
        </div>
        <PlaceholderPhoto label="Featured work" ratio="portrait" tone="warm" className="md:justify-self-end md:w-4/5 shadow-2xl shadow-blue/10" />
      </section>

      {/* Highlights */}
      <section className="border-y border-hairline bg-panel/60">
        <div className="container-page grid gap-px overflow-hidden bg-hairline py-px sm:grid-cols-3">
          {highlights.map((item) => (
            <div key={item.title} className="bg-black px-8 py-12 transition-colors hover:bg-panel">
              <h2 className="font-display text-xl text-white">{item.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">{item.copy}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Recent work strip */}
      <section className="container-page py-24">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold tracking-wider text-blue-light uppercase">Gallery</p>
            <h2 className="mt-1 font-display text-3xl text-white">Recent work</h2>
          </div>
          <Link to="/portfolio" className="text-sm font-medium text-blue-light hover:text-blue transition-colors">
            Full portfolio →
          </Link>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <PlaceholderPhoto label="Autumn wedding, Hartwell" tone="warm" className="lg:col-span-2" />
          <PlaceholderPhoto label="Founder portrait" ratio="portrait" tone="cool" />
          <PlaceholderPhoto label="Product launch" tone="neutral" />
          <PlaceholderPhoto label="Family, golden hour" tone="warm" />
          <PlaceholderPhoto label="Gala, downtown" tone="cool" />
        </div>
      </section>

      {/* SnapFind AI callout */}
      <section className="container-page pb-28">
        <div className="grid gap-10 rounded-2xl border border-blue/30 bg-panel p-10 md:grid-cols-[1.2fr,1fr] md:items-center md:p-14 shadow-xl shadow-blue/5">
          <div>
            <p className="text-sm font-medium tracking-wide text-blue-light uppercase">For guests &amp; clients</p>
            <h2 className="mt-4 font-display text-3xl leading-tight text-white">
              Were you at one of my events? Your photos are already waiting.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
              Every gallery I shoot is hosted on <span className="text-white font-medium">SnapFind AI</span>. Scan the QR
              code from the event, or search with a selfie, and every photo
              you're in comes straight to you — no scrolling through
              hundreds of shots.
            </p>
          </div>
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex items-center gap-3 rounded-lg border border-hairline bg-black px-5 py-4 text-white">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue/20 text-xs font-bold text-blue-light">1</span>
              Scan the event QR code
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-hairline bg-black px-5 py-4 text-white">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue/20 text-xs font-bold text-blue-light">2</span>
              Take or upload a selfie
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-hairline bg-black px-5 py-4 text-white">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue/20 text-xs font-bold text-blue-light">3</span>
              Download every photo you're in
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
