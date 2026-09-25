import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import QRCode from "qrcode";
import { Alert, Button, Card } from "../common";
import { eventsApi } from "../../services/api";
import type { SnapEvent } from "../../types";

interface QRPanelProps {
  event: SnapEvent;
  onRegenerateToken?: (newToken: string) => void;
}

export const QRPanel: React.FC<QRPanelProps> = ({
  event,
  onRegenerateToken,
}) => {
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(true);

  // Network Host options:
  // "wifi": Uses the local LAN IP (e.g. http://192.168.1.4:5173) so mobile phones on the same Wi-Fi can scan & open
  // "localhost": Uses current browser origin (e.g. http://localhost:5173)
  // "custom": User-entered custom domain or tunnel URL
  const [hostMode, setHostMode] = useState<"wifi" | "localhost" | "custom">("wifi");
  const [customHost, setCustomHost] = useState<string>("http://192.168.1.4:5173");

  const getBaseUrl = () => {
    if (hostMode === "wifi") {
      return customHost || "http://192.168.1.4:5173";
    }
    if (hostMode === "localhost") {
      return window.location.origin;
    }
    return customHost;
  };

  const baseUrl = getBaseUrl().replace(/\/+$/, "");
  const galleryUrl = `${baseUrl}/event/${event.token}`;

  useEffect(() => {
    let isMounted = true;
    setIsGenerating(true);

    QRCode.toDataURL(galleryUrl, {
      width: 600,
      margin: 2,
      errorCorrectionLevel: "H",
      color: {
        dark: "#0B0D12",
        light: "#FFFFFF",
      },
    })
      .then((url) => {
        if (isMounted) {
          setQrDataUrl(url);
          setIsGenerating(false);
        }
      })
      .catch((err) => {
        console.error("Failed to generate QR code:", err);
        if (isMounted) setIsGenerating(false);
      });

    return () => {
      isMounted = false;
    };
  }, [galleryUrl]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(galleryUrl);
    setCopied(true);
    showToast("Gallery link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    const safeName = event.name.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    a.download = `snapfind_qr_${event.token}_${safeName}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast(`Downloaded scannable PNG QR code for "${event.name}"!`);
  };

  const handleDownloadSVG = async () => {
    try {
      const svgString = await QRCode.toString(galleryUrl, {
        type: "svg",
        margin: 2,
        errorCorrectionLevel: "H",
        color: { dark: "#0B0D12", light: "#FFFFFF" },
      });
      const blob = new Blob([svgString], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeName = event.name.toLowerCase().replace(/[^a-z0-9]+/g, "_");
      a.download = `snapfind_qr_${event.token}_${safeName}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(`Downloaded vector SVG QR code for "${event.name}"!`);
    } catch (err: any) {
      showToast(`Failed to generate SVG QR: ${err?.message || "Error"}`);
    }
  };

  const handlePrintQR = () => {
    window.print();
  };

  const handleRegenerateQR = async () => {
    const confirmed = window.confirm(
      "Warning: Regenerating the QR token will immediately invalidate previous links and printed QR codes for this event. Do you want to proceed?"
    );
    if (!confirmed) return;

    try {
      const res = await eventsApi.regenerateToken(event.id);
      if (onRegenerateToken) {
        onRegenerateToken(res.token);
      }
      showToast(`New secure QR token activated: ${res.token}`);
    } catch (err: any) {
      showToast(`Token regeneration failed: ${err?.message || "Unknown error"}`);
    }
  };

  return (
    <div className="space-y-6">
      {toast && (
        <Alert type="success" onClose={() => setToast(null)}>
          {toast}
        </Alert>
      )}

      {/* Network Alert Banner for Mobile Phone Testing */}
      <div className="rounded-2xl border border-studio-sand bg-studio-cream/60 p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-studio-forest/10 text-studio-forest shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h4 className="text-xs font-bold text-studio-charcoal uppercase tracking-wider flex items-center gap-2">
              <span>Mobile Phone Scanning Ready</span>
              <span className="px-2 py-0.5 rounded-full bg-[#DCE9D1] text-studio-forest text-[10px] font-mono font-bold">
                ACTIVE WI-FI: 192.168.1.4
              </span>
            </h4>
            <p className="text-xs text-studio-muted mt-0.5 max-w-2xl">
              To scan this QR code using a real smartphone camera, both your computer and phone must be on the same Wi-Fi network. The QR code below encodes <span className="font-mono text-studio-forest font-semibold">{baseUrl}</span>.
            </p>
          </div>
        </div>

        {/* Host Mode Toggles */}
        <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-studio-sand shrink-0 text-xs shadow-xs">
          <button
            type="button"
            onClick={() => {
              setHostMode("wifi");
              setCustomHost("http://192.168.1.4:5173");
            }}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              hostMode === "wifi"
                ? "bg-studio-forest text-white shadow-xs font-semibold"
                : "text-studio-muted hover:text-studio-charcoal"
            }`}
          >
            Wi-Fi (Phones)
          </button>
          <button
            type="button"
            onClick={() => setHostMode("localhost")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              hostMode === "localhost"
                ? "bg-studio-forest text-white shadow-xs font-semibold"
                : "text-studio-muted hover:text-studio-charcoal"
            }`}
          >
            Localhost
          </button>
          <button
            type="button"
            onClick={() => setHostMode("custom")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              hostMode === "custom"
                ? "bg-studio-forest text-white shadow-xs font-semibold"
                : "text-studio-muted hover:text-studio-charcoal"
            }`}
          >
            Custom IP/Domain
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left Column: Printable QR Card (6 cols) */}
        <Card className="p-8 lg:col-span-6 flex flex-col items-center text-center space-y-6 bg-white border-studio-sand shadow-xs">
          {/* Printable Event QR Sign Board */}
          <div className="w-full max-w-sm rounded-3xl bg-[#FAF8F5] p-8 text-studio-charcoal shadow-md space-y-5 border-2 border-studio-sand print:m-0 print:shadow-none">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-widest text-studio-forest">
                🌿 SnapFind Studio • Live Event
              </span>
              <h3 className="text-2xl font-serif font-bold text-studio-charcoal leading-tight">
                {event.name}
              </h3>
              <p className="text-xs text-studio-muted">
                Scan with your phone camera to find all your photos with a selfie
              </p>
            </div>

            {/* High-Resolution Verified Scannable QR Code Image */}
            <div className="relative mx-auto w-56 h-56 bg-white p-3 rounded-2xl border-2 border-studio-sand shadow-inner flex items-center justify-center">
              {isGenerating || !qrDataUrl ? (
                <div className="flex flex-col items-center justify-center text-xs text-studio-muted gap-2">
                  <div className="h-6 w-6 border-2 border-studio-forest border-t-transparent rounded-full animate-spin" />
                  <span>Generating QR...</span>
                </div>
              ) : (
                <img
                  src={qrDataUrl}
                  alt={`Scannable QR Code for ${event.name}`}
                  className="w-full h-full object-contain rounded-lg transition-transform duration-200 hover:scale-105"
                />
              )}
            </div>

            <div className="pt-3 border-t border-studio-sand">
              <p className="text-[11px] font-semibold text-studio-muted">Event Shortcode</p>
              <p className="font-mono text-xl font-extrabold text-studio-forest tracking-widest mt-0.5">
                {event.token}
              </p>
              <p className="text-[10px] text-studio-muted mt-1 truncate font-mono select-all">
                {galleryUrl}
              </p>
            </div>
          </div>
        </Card>

        {/* Right Column: QR Details & Actions (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <Card className="p-6 space-y-5 bg-white border-studio-sand shadow-xs">
            <div>
              <h3 className="text-base font-serif font-semibold text-studio-charcoal">Gallery Access Details</h3>
              <p className="text-xs text-studio-muted mt-0.5">
                Guests can access this gallery either by scanning the QR code or visiting the URL.
              </p>
            </div>

            {/* Custom host input (if custom mode is selected) */}
            {hostMode === "custom" && (
              <div className="space-y-1.5 p-3 rounded-xl bg-studio-cream border border-studio-sand animate-fade-in">
                <label className="text-xs font-semibold text-studio-charcoal">
                  Custom Base URL or Tunnel (e.g. ngrok / domain)
                </label>
                <input
                  type="text"
                  value={customHost}
                  onChange={(e) => setCustomHost(e.target.value)}
                  placeholder="https://gallery.yourdomain.com"
                  className="w-full rounded-xl border border-studio-sand bg-white px-3.5 py-2 text-xs font-mono text-studio-charcoal outline-none focus:border-studio-forest"
                />
                <p className="text-[11px] text-studio-muted">
                  Enter your production domain or ngrok public tunnel to test from external mobile networks.
                </p>
              </div>
            )}

            {/* URL Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-studio-muted">Encoded Gallery URL</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={galleryUrl}
                  className="flex-1 rounded-xl border border-studio-sand bg-studio-cream/40 px-3.5 py-2 text-xs font-mono text-studio-charcoal outline-none"
                />
                <Button size="sm" variant="secondary" onClick={handleCopy}>
                  {copied ? "Copied!" : "Copy Link"}
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-studio-sand grid grid-cols-2 gap-3">
              <Button variant="primary" onClick={handleDownloadQR} className="active:scale-95 transition-all shadow-sm">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download PNG
              </Button>
              <Button variant="secondary" onClick={handleDownloadSVG} className="active:scale-95 transition-all">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download SVG
              </Button>
              <Button variant="secondary" onClick={handlePrintQR} className="active:scale-95 transition-all">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print Sign Board
              </Button>
              <Button variant="secondary" onClick={handleRegenerateQR} className="active:scale-95 transition-all">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Regenerate Token
              </Button>
              <Link to={`/event/${event.token}`} target="_blank" className="w-full col-span-2">
                <Button variant="secondary" className="w-full border border-studio-sand active:scale-95 transition-all">
                  Open Event Guest Landing ↗
                </Button>
              </Link>
            </div>
          </Card>

          {/* Placard Pro-Tips */}
          <Card className="p-6 text-xs text-studio-muted space-y-3 bg-white border-studio-sand shadow-xs">
            <h4 className="font-semibold text-studio-charcoal flex items-center gap-2">
              <span className="text-sm">💡</span> Photographer Event Placards
            </h4>
            <p className="leading-relaxed">
              Print this QR code card and place it on event dining tables, welcome banners, or guest cards.
              Guests point their native phone camera (iOS Camera or Google Lens / Android Camera), tap the link, and immediately upload a selfie to find all their photos across the entire album.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};
