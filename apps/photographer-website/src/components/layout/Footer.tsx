import { Link } from "react-router-dom";
import { siteConfig } from "../../config/siteConfig";

export default function Footer() {
  const findMyPhotosIsExternal = siteConfig.findMyPhotosUrl.startsWith("http");
  const whatsappUrl = `https://wa.me/${siteConfig.whatsapp.replace(/[^\d]/g, "")}`;

  return (
    <footer className="border-t border-hairline bg-panel">
      <div className="container-page grid gap-10 py-16 md:grid-cols-4">
        <div className="md:col-span-2">
          <span className="font-display text-lg text-ivory">{siteConfig.logoText}</span>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
            {siteConfig.tagline} Wedding, event, and portrait photography —
            every gallery delivered through SnapFind AI.
          </p>
          <div className="mt-5 flex gap-4 text-sm text-muted">
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

        <div>
          <h3 className="text-sm text-ivory">Navigation</h3>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            <li><Link to="/portfolio" className="hover:text-ivory">Portfolio</Link></li>
            <li><Link to="/services" className="hover:text-ivory">Services</Link></li>
            <li><Link to="/booking" className="hover:text-ivory">Booking</Link></li>
            <li><Link to="/contact" className="hover:text-ivory">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm text-ivory">Find your photos</h3>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Attended an event we shot? Search your gallery on SnapFind AI.
          </p>
          <a
            href={siteConfig.findMyPhotosUrl}
            target={findMyPhotosIsExternal ? "_blank" : undefined}
            rel={findMyPhotosIsExternal ? "noopener noreferrer" : undefined}
            className="mt-3 inline-block text-sm text-brass-light hover:text-brass"
          >
            Find My Photos →
          </a>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 block text-sm text-brass-light hover:text-brass"
          >
            Message us on WhatsApp →
          </a>
        </div>
      </div>

      <div className="border-t border-hairline">
        <div className="container-page flex flex-col gap-3 py-6 text-xs text-muted md:flex-row md:items-center md:justify-between">
          <span>© {new Date().getFullYear()} {siteConfig.businessName}. All rights reserved.</span>
          <div className="flex gap-4">
            <a href={siteConfig.legal.privacyUrl} className="hover:text-ivory">Privacy</a>
            <a href={siteConfig.legal.termsUrl} className="hover:text-ivory">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
