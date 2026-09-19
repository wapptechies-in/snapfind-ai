import type { ReactNode } from "react";

type Props = {
  eyebrow?: string;
  heading: ReactNode;
  description?: string;
  align?: "left" | "center";
  className?: string;
  children?: ReactNode;
  as?: "h1" | "h2" | "h3";
};

export default function Section({
  eyebrow,
  heading,
  description,
  align = "left",
  className = "",
  children,
  as = "h2",
}: Props) {
  const Heading = as;
  const alignClass = align === "center" ? "mx-auto text-center" : "";

  return (
    <section className={className}>
      <div className={`container-page max-w-2xl ${align === "center" ? alignClass : ""}`}>
        {eyebrow && <p className="text-sm tracking-wide text-brass-light">{eyebrow}</p>}
        <Heading className="mt-4 font-display text-3xl leading-tight text-ivory md:text-4xl">
          {heading}
        </Heading>
        {description && <p className="mt-5 text-sm leading-relaxed text-muted">{description}</p>}
      </div>
      {children}
    </section>
  );
}
