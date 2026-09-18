import PlaceholderPhoto from "../components/PlaceholderPhoto";

export default function About() {
  return (
    <div className="container-page grid gap-16 py-20 md:grid-cols-2 md:items-start md:gap-14 md:py-28">
      <PlaceholderPhoto label="At work" ratio="portrait" tone="cool" className="md:sticky md:top-28 shadow-2xl shadow-blue/10" />

      <div>
        <p className="text-sm font-medium tracking-wide text-blue-light uppercase">About</p>
        <h1 className="mt-4 font-display text-4xl leading-tight text-white md:text-5xl">
          I photograph the parts of an event people actually remember.
        </h1>
        <div className="mt-8 space-y-5 text-[15px] leading-relaxed text-muted">
          <p>
            Not the posed line-up — the moment right before it, when
            someone's still laughing at something off to the side. I've
            been shooting weddings, events, and portraits for over a
            decade, and the brief is always the same: stay out of the way,
            and bring back the day as it actually happened.
          </p>
          <p>
            A typical week has me on a rooftop for a product launch, at a
            vineyard for a wedding, and in a studio for a founder's
            headshots — different rooms, same instinct for the moment
            that's about to happen.
          </p>
          <p>
            Every gallery I deliver goes out through <span className="text-white font-medium">SnapFind AI</span>, which is
            the other half of this practice: photos are only useful if the
            people in them can find them. Guests get a QR code at the
            event and can search their own gallery with a selfie instead
            of scrolling through hundreds of frames.
          </p>
        </div>

        <dl className="mt-10 grid grid-cols-2 gap-6 border-t border-hairline pt-8 sm:grid-cols-4">
          {[
            ["12+", "Years shooting"],
            ["300+", "Events covered"],
            ["2", "Cities based in"],
            ["48h", "Typical delivery"],
          ].map(([value, label]) => (
            <div key={label}>
              <dt className="font-display text-2xl text-white">{value}</dt>
              <dd className="mt-1 text-xs text-muted">{label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
