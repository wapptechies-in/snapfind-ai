import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Alert, Button, Card } from "../common";
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

  const galleryUrl = `${window.location.origin}/event/${event.token}`;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(galleryUrl);
    setCopied(true);
    showToast("Gallery shortlink copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    showToast(`Downloaded QR placard for "${event.name}" (MOCK).`);
  };

  const handlePrintQR = () => {
    window.print();
  };

  const handleRegenerateQR = () => {
    const newToken = `EVT${Math.floor(1000 + Math.random() * 9000)}`;
    if (onRegenerateToken) {
      onRegenerateToken(newToken);
    }
    showToast(`New QR code and token generated: ${newToken}`);
  };

  return (
    <div className="space-y-6">
      {toast && (
        <Alert type="success" onClose={() => setToast(null)}>
          {toast}
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left Column: Printable QR Card (6 cols) */}
        <Card className="p-8 lg:col-span-6 flex flex-col items-center text-center space-y-6">
          {/* Printable Event QR Sign Board */}
          <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-black shadow-2xl space-y-4 border border-zinc-200 print:m-0 print:shadow-none">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-violet">
                SnapFind AI Gallery
              </span>
              <h3 className="text-xl font-serif font-bold text-zinc-900 leading-tight">
                {event.name}
              </h3>
              <p className="text-xs text-zinc-500">Scan to find all your photos with a selfie</p>
            </div>

            {/* High-Resolution SVG QR Code Representation */}
            <div className="mx-auto w-52 h-52 bg-white p-2 rounded-xl border border-zinc-100 flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 100 100" fill="#0B0D12" aria-label="QR Code">
                <path d="M0 0h30v30H0zM5 5h20v20H5zM10 10h10v10H10zM70 0h30v30H70zM75 5h20v20H75zM80 10h10v10H80zM0 70h30v30H0zM5 75h20v20H5zM10 80h10v10H10zM35 10h5v10h-5zM45 5h10v5h-10zM50 15h15v5H50zM35 25h10v15H35zM50 30h5v10h-5zM60 25h10v10H60zM75 35h15v10H75zM10 35h10v10H10zM25 40h5v15h-5zM35 50h20v5H35zM60 45h5v20H60zM70 50h10v15H70zM85 55h15v10H85zM35 60h5v20h-5zM45 70h15v5H45zM50 80h10v15H50zM65 75h10v20H65zM80 75h15v5H80zM75 90h20v5H75z" />
              </svg>
            </div>

            <div className="pt-2 border-t border-zinc-100">
              <p className="text-[11px] font-medium text-zinc-600">Event Shortcode</p>
              <p className="font-mono text-base font-bold text-violet tracking-widest">
                {event.token}
              </p>
              <p className="text-[10px] text-zinc-400 mt-1 truncate">{galleryUrl}</p>
            </div>
          </div>
        </Card>

        {/* Right Column: QR Details & Actions (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <Card className="p-6 space-y-5">
            <div>
              <h3 className="text-base font-semibold text-cloud">Gallery Access Details</h3>
              <p className="text-xs text-dim mt-0.5">
                Guests can access this gallery either by scanning the QR code or visiting the URL.
              </p>
            </div>

            {/* URL Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-dim">Direct Gallery Link</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={galleryUrl}
                  className="flex-1 rounded-lg border border-hairline bg-base px-3.5 py-2 text-xs font-mono text-cloud outline-none"
                />
                <Button size="sm" variant="secondary" onClick={handleCopy}>
                  {copied ? "Copied!" : "Copy Link"}
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-hairline grid grid-cols-2 gap-3">
              <Button variant="primary" onClick={handleDownloadQR}>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download QR
              </Button>
              <Button variant="secondary" onClick={handlePrintQR}>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print QR Card
              </Button>
              <Button variant="outline" onClick={handleRegenerateQR}>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Regenerate QR
              </Button>
              <Link to={`/event/${event.token}`} target="_blank" className="w-full">
                <Button variant="ghost" className="w-full border border-hairline">
                  Open Gallery ↗
                </Button>
              </Link>
            </div>
          </Card>

          {/* Placard Pro-Tips */}
          <Card className="p-6 text-xs text-dim space-y-3">
            <h4 className="font-semibold text-cloud">Photographer Pro-Tip</h4>
            <p className="leading-relaxed">
              Print this QR code card and place it on event tables, reception desks, or ceremony handouts.
              Guests simply point their phone camera, take a quick selfie, and immediately discover every photo they appear in without browsing through thousands of shots!
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

