const points = [
  {
    title: "Documentary style",
    copy: "Real moments, not stiff poses — the day as it actually happened.",
  },
  {
    title: "Fast delivery",
    copy: "Edited galleries delivered on a clear, predictable timeline.",
  },
  {
    title: "Findable photos",
    copy: "Every gallery runs on SnapFind AI, so guests find their own photos in seconds.",
  },
  {
    title: "Originals stay safe",
    copy: "Full-resolution originals are kept securely — never lost in transit.",
  },
];

export default function WhyChooseUs() {
  return (
    <section className="border-y border-hairline bg-panel/40">
      <div className="container-page py-20">
        <div className="max-w-xl">
          <p className="text-sm tracking-wide text-brass-light">Why choose us</p>
          <h2 className="mt-4 font-display text-3xl text-ivory md:text-4xl">
            A calm, dependable process behind every shoot.
          </h2>
        </div>
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {points.map((p) => (
            <div key={p.title}>
              <div className="h-px w-10 bg-brass" />
              <h3 className="mt-4 text-sm font-medium text-ivory">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{p.copy}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
