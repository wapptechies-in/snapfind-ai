import { useEffect } from "react";
import { siteConfig } from "../../config/siteConfig";

type Props = {
  title: string;
  description?: string;
};

function setMeta(name: string, content: string, attr: "name" | "property" = "name") {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

/**
 * Lightweight SEO helper — no external dependency required. Sets the
 * document title and a handful of meta tags on mount/update. This is a
 * Phase 2 "foundation" per the spec, not a full SEO solution (no
 * per-route server rendering, no sitemap, etc.).
 *
 * Status: IMPLEMENTED (foundation only)
 */
export default function SEO({ title, description }: Props) {
  useEffect(() => {
    const fullTitle = siteConfig.seo.titleTemplate.replace("%s", title);
    document.title = fullTitle;

    const desc = description ?? siteConfig.seo.defaultDescription;
    setMeta("description", desc);
    setMeta("og:title", fullTitle, "property");
    setMeta("og:description", desc, "property");
    setMeta("og:type", "website", "property");
  }, [title, description]);

  return null;
}
