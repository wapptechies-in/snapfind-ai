import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Alert, Button, Card } from "../common";
import { eventsApi } from "../../api";
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
  // "localhost": Uses current browser origin or localhost:5173
  // "custom": User-entered custom domain or tunnel URL
  const [hostMode, setHostMode] = useState<"wifi" | "localhost" | "custom">("wifi");
  const [customHost, setCustomHost] = useState<string>("http://192.168.1.4:5173");

  const getBaseUrl = () => {
    if (hostMode === "wifi") {
      return customHost || "http://192.168.1.4:5173";
    }
    if (hostMode === "localhost") {
      return "http://localhost:5173";
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
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Error";
      showToast(`Failed to generate SVG QR: ${errorMsg}`);
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
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      showToast(`Token regeneration failed: ${errorMsg}`);
    }
  };

  const handleOpenGuestLanding = (e: React.MouseEvent) => {
    e.preventDefault();
    if (window.desktopAPI?.openExternal) {
      window.desktopAPI.openExternal(galleryUrl);
    } else {
      window.open(galleryUrl, "_blank");
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
      <div className="rounded-xl border border-hairline bg-slate p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-gold/10 text-gold shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h4 className="text-xs font-bold text-soft-white uppercase tracking-wider flex items-center gap-2">
              <span>Mobile Phone Scanning Ready</span>
              <span className="px-2 py-0.5 rounded-full bg-gold/20 text-gold text-[10px] font-mono font-bold">
                ACTIVE WI-FI: 192.168.1.4
              </span>
            </h4>
            <p className="text-xs text-cool-gray mt-0.5 max-w-2xl">
              To scan this QR code using a real smartphone camera, both your computer and phone must be on the same Wi-Fi network. The QR code below encodes <span className="font-mono text-gold font-semibold">{baseUrl}</span>.
            </p>
          </div>
        </div>

        {/* Host Mode Toggles */}
        <div className="flex items-center gap-1.5 p-1 bg-midnight rounded-xl border border-hairline shrink-0 text-xs shadow-xs">
          <button
            type="button"
            onClick={() => {
              setHostMode("wifi");
              setCustomHost("http://192.168.1.4:5173");
            }}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              hostMode === "wifi"
                ? "bg-gold text-midnight shadow-xs font-bold"
                : "text-cool-gray hover:text-soft-white"
            }`}
          >
            Wi-Fi (Phones)
          </button>
          <button
            type="button"
            onClick={() => setHostMode("localhost")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              hostMode === "localhost"
                ? "bg-gold text-midnight shadow-xs font-bold"
                : "text-cool-gray hover:text-soft-white"
            }`}
          >
            Localhost
          </button>
          <button
            type="button"
            onClick={() => setHostMode("custom")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              hostMode === "custom"
                ? "bg-gold text-midnight shadow-xs font-bold"
                : "text-cool-gray hover:text-soft-white"
            }`}
          >
            Custom IP/Domain
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left Column: Printable QR Card (6 cols) */}
        <Card className="p-8 lg:col-span-6 flex flex-col items-center text-center space-y-6 bg-slate border-hairline shadow-sm">
          {/* Printable Event QR Sign Board */}
          <div className="w-full max-w-sm rounded-2xl bg-midnight p-8 text-soft-white shadow-xl space-y-5 border border-gold/30 print:m-0 print:shadow-none">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-widest text-gold">
                ✦ SnapFind AI • Live Event
              </span>
              <h3 className="text-2xl font-bold text-soft-white leading-tight">
                {event.name}
              </h3>
              <p className="text-xs text-cool-gray">
                Scan with your phone camera to find all your photos with a selfie
              </p>
            </div>

            {/* High-Resolution Verified Scannable QR Code Image */}
            <div className="relative mx-auto w-56 h-56 bg-white p-3 rounded-xl border border-hairline shadow-inner flex items-center justify-center">
              {isGenerating || !qrDataUrl ? (
                <div className="flex flex-col items-center justify-center text-xs text-cool-gray gap-2">
                  <div className="h-6 w-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
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

            <div className="pt-3 border-t border-hairline">
              <p className="text-[11px] font-semibold text-cool-gray">Event Shortcode</p>
              <p className="font-mono text-xl font-extrabold text-gold tracking-widest mt-0.5">
                {event.token}
              </p>
              <p className="text-[10px] text-cool-gray mt-1 truncate font-mono select-all">
                {galleryUrl}
              </p>
            </div>
          </div>
        </Card>

        {/* Right Column: QR Details & Actions (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <Card className="p-6 space-y-5 bg-slate border-hairline shadow-sm">
            <div>
              <h3 className="text-base font-bold text-soft-white">Gallery Access Details</h3>
              <p className="text-xs text-cool-gray mt-0.5">
                Guests can access this gallery either by scanning the QR code or visiting the URL.
              </p>
            </div>

            {/* Custom host input (if custom mode is selected) */}
            {hostMode === "custom" && (
              <div className="space-y-1.5 p-3 rounded-xl bg-midnight border border-hairline animate-fade-in">
                <label className="text-xs font-semibold text-soft-white">
                  Custom Base URL or Tunnel (e.g. ngrok / domain)
                </label>
                <input
                  type="text"
                  value={customHost}
                  onChange={(e) => setCustomHost(e.target.value)}
                  placeholder="https://gallery.yourdomain.com"
                  className="w-full rounded-xl border border-hairline bg-slate px-3.5 py-2 text-xs font-mono text-soft-white outline-none focus:border-gold"
                />
                <p className="text-[11px] text-cool-gray">
                  Enter your production domain or ngrok public tunnel to test from external mobile networks.
                </p>
              </div>
            )}

            {/* URL Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-cool-gray">Encoded Gallery URL</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={galleryUrl}
                  className="flex-1 rounded-xl border border-hairline bg-midnight px-3.5 py-2 text-xs font-mono text-soft-white outline-none"
                />
                <Button size="sm" variant="secondary" onClick={handleCopy}>
                  {copied ? "Copied!" : "Copy Link"}
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-hairline grid grid-cols-2 gap-3">
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
              <button
                type="button"
                onClick={handleOpenGuestLanding}
                className="col-span-2 w-full inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-150 border focus:outline-none focus:ring-2 focus:ring-offset-2 bg-slate-800 text-soft-white hover:bg-slate-700 border-slate-700 px-4 py-2 text-sm cursor-pointer active:scale-95"
              >
                Open Guest Landing ↗
              </button>
            </div>
          </Card>

          {/* Placard Pro-Tips */}
          <Card className="p-6 text-xs text-cool-gray space-y-3 bg-slate border-hairline shadow-sm">
            <h4 className="font-bold text-soft-white flex items-center gap-2">
              <span className="text-gold">✦</span> Photographer Event Placards
            </h4>
            <p className="leading-relaxed">
              Print this QR code card and place it on event dining tables, welcome banners, or guest cards.
              Guests point their native phone camera, tap the link, and immediately upload a selfie to find all their photos across the entire album.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};
