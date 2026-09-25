import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Button } from "../primitives/Button";
import { Modal } from "../primitives/Modal";
import type { SnapEvent } from "@snapfind/types";

export interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: SnapEvent | null;
  onOpenExternal?: (url: string) => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  event,
  onOpenExternal,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [hostMode, setHostMode] = useState<"wifi" | "localhost">("wifi");
  const [wifiIp, setWifiIp] = useState<string>("http://192.168.1.4:5173");

  const token = event?.public_token || event?.token || "";
  const baseUrl = hostMode === "wifi" ? wifiIp : "http://localhost:5173";
  const galleryUrl = `${baseUrl.replace(/\/+$/, "")}/event/${token}`;

  useEffect(() => {
    if (!event || !isOpen) return;

    let isMounted = true;
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
        if (isMounted) setQrDataUrl(url);
      })
      .catch((err) => {
        console.error("Failed to generate QR code:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [event, galleryUrl, isOpen]);

  if (!event) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(galleryUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    const safeName = (event.name || "event").toLowerCase().replace(/[^a-z0-9]+/g, "_");
    a.download = `snapfind_qr_${token}_${safeName}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleOpenBrowser = () => {
    if (onOpenExternal) {
      onOpenExternal(galleryUrl);
    } else if (typeof window !== "undefined" && (window as any).desktopAPI?.openExternal) {
      (window as any).desktopAPI.openExternal(galleryUrl);
    } else {
      window.open(galleryUrl, "_blank");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Event QR Code — ${event.name}`}>
      <div className="space-y-4">
        {/* Network Host Switcher */}
        <div className="flex items-center justify-between p-2.5 rounded-xl border border-hairline bg-panel2 text-xs">
          <span className="text-dim font-medium">Network Scope:</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setHostMode("wifi")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                hostMode === "wifi"
                  ? "bg-violet text-white shadow-sm"
                  : "text-dim hover:text-cloud hover:bg-panel"
              }`}
            >
              📱 Mobile Wi-Fi (LAN)
            </button>
            <button
              type="button"
              onClick={() => setHostMode("localhost")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                hostMode === "localhost"
                  ? "bg-violet text-white shadow-sm"
                  : "text-dim hover:text-cloud hover:bg-panel"
              }`}
            >
              💻 Localhost (5173)
            </button>
          </div>
        </div>

        {hostMode === "wifi" && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-dim font-mono">Host:</span>
            <input
              type="text"
              value={wifiIp}
              onChange={(e) => setWifiIp(e.target.value)}
              className="flex-1 px-2.5 py-1 rounded-lg border border-hairline bg-panel2 text-xs font-mono text-cloud focus:border-violet focus:outline-none"
              placeholder="http://192.168.1.4:5173"
            />
          </div>
        )}

        {/* QR Code Presentation Box */}
        <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-white text-center shadow-xl border border-zinc-200">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={`QR Code for ${event.name}`}
              className="w-56 h-56 rounded-xl object-contain shadow-sm"
            />
          ) : (
            <div className="w-56 h-56 flex items-center justify-center text-gray-500 font-mono text-xs">
              Generating high-res QR code...
            </div>
          )}

          <div className="mt-3 text-center">
            <p className="text-sm font-black text-gray-900 tracking-tight">{event.name}</p>
            <p className="text-xs font-mono text-gray-600 mt-0.5">
              Shortcode: <span className="font-bold text-violet-700">{token}</span>
            </p>
            <p className="text-[11px] text-gray-500 mt-1 max-w-xs">
              Scan with any smartphone camera to find photos with facial recognition.
            </p>
          </div>
        </div>

        {/* URL Box with Copy */}
        <div className="p-3 rounded-xl border border-hairline bg-panel2 flex items-center justify-between gap-2">
          <p className="text-xs font-mono text-dim truncate flex-1">{galleryUrl}</p>
          <button
            type="button"
            onClick={handleCopy}
            className="px-2.5 py-1 rounded-lg bg-violet/20 hover:bg-violet text-violet-light hover:text-white text-xs font-semibold transition-all active:scale-95 cursor-pointer whitespace-nowrap"
          >
            {copied ? "✓ Copied!" : "Copy Link"}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-hairline">
          <Button size="sm" variant="secondary" onClick={handleDownload}>
            <svg className="w-3.5 h-3.5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download PNG
          </Button>

          <Button size="sm" variant="primary" onClick={handleOpenBrowser}>
            <svg className="w-3.5 h-3.5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            Open Gallery ↗
          </Button>
        </div>
      </div>
    </Modal>
  );
};

