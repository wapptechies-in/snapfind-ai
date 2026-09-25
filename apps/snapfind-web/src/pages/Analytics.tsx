import { useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { Card } from "../components/common";

interface TopGallery {
  id: string;
  name: string;
  type: string;
  views: number;
  downloads: number;
  searches: number;
  conversion: string;
}

const mockTopGalleries: TopGallery[] = [
  { id: "1", name: "Sarah & David Wedding", type: "Wedding", views: 18420, downloads: 4120, searches: 5890, conversion: "78%" },
  { id: "2", name: "Royal Palace Gala 2026", type: "Corporate", views: 12300, downloads: 2850, searches: 3940, conversion: "64%" },
  { id: "3", name: "Golden Sunset Candid Portraits", type: "Candid", views: 9840, downloads: 1420, searches: 1980, conversion: "58%" },
  { id: "4", name: "Grand Luxe Anniversary", type: "Family", views: 7730, downloads: 760, searches: 1030, conversion: "51%" },
];

export default function Analytics() {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "all">("30d");

  return (
    <DashboardLayout title="Studio Analytics">
      <div className="space-y-8 max-w-6xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-semibold text-studio-charcoal tracking-tight">
              Studio Analytics & Insights
            </h1>
            <p className="text-xs md:text-sm text-studio-muted mt-1">
              Real-time performance of client galleries, guest QR scans, and AI facial searches.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-2xl bg-white border border-studio-sand p-1 shadow-xs">
            {(["7d", "30d", "90d", "all"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                  timeRange === r
                    ? "bg-studio-forest text-white shadow-xs"
                    : "text-studio-muted hover:text-studio-charcoal hover:bg-studio-cream"
                }`}
              >
                {r === "7d" ? "7 Days" : r === "30d" ? "30 Days" : r === "90d" ? "Quarter" : "All Time"}
              </button>
            ))}
          </div>
        </div>

        {/* 4 Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 bg-white border-studio-sand shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-studio-muted uppercase tracking-wider">Total Views</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#DCE9D1] text-studio-forest font-bold">+14.2%</span>
            </div>
            <p className="font-serif text-3xl font-bold text-studio-charcoal mt-3">48,290</p>
            <p className="text-[11px] text-studio-muted mt-1">Unique client & guest sessions</p>
          </Card>

          <Card className="p-5 bg-white border-studio-sand shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-studio-muted uppercase tracking-wider">Active Guests</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#F7E4C5] text-[#9A7E58] font-bold">+8.6%</span>
            </div>
            <p className="font-serif text-3xl font-bold text-studio-charcoal mt-3">3,420</p>
            <p className="text-[11px] text-studio-muted mt-1">Scanned event QR codes</p>
          </Card>

          <Card className="p-5 bg-white border-studio-sand shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-studio-muted uppercase tracking-wider">AI Facial Matches</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#ECE9FA] text-[#6355A4] font-bold">+24.1%</span>
            </div>
            <p className="font-serif text-3xl font-bold text-studio-charcoal mt-3">12,840</p>
            <p className="text-[11px] text-studio-muted mt-1">Selfie searches matched</p>
          </Card>

          <Card className="p-5 bg-white border-studio-sand shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-studio-muted uppercase tracking-wider">Photo Downloads</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#DDF2E9] text-studio-forest font-bold">+18.4%</span>
            </div>
            <p className="font-serif text-3xl font-bold text-studio-charcoal mt-3">9,150</p>
            <p className="text-[11px] text-studio-muted mt-1">Saved high-res memories</p>
          </Card>
        </div>

        {/* Engagement Trend Chart Simulation */}
        <Card className="p-6 bg-white border-studio-sand shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="font-serif text-lg font-semibold text-studio-charcoal">Gallery Engagement & Search Velocity</h2>
              <p className="text-xs text-studio-muted mt-0.5">Daily breakdown of gallery impressions vs. facial searches</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-studio-forest" />
                <span className="text-studio-charcoal">Gallery Views</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#C5A880]" />
                <span className="text-studio-charcoal">Facial Searches</span>
              </div>
            </div>
          </div>

          {/* Graphical SVG Bar/Wave */}
          <div className="h-56 w-full pt-4 flex items-end justify-between gap-2 border-b border-studio-sand/70 pb-2">
            {[45, 62, 58, 80, 75, 90, 85, 110, 105, 130, 125, 145].map((val, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                <div
                  className="w-full max-w-[28px] rounded-t-lg bg-studio-forest/20 group-hover:bg-studio-forest/35 transition-all relative overflow-hidden"
                  style={{ height: `${(val / 150) * 100}%` }}
                >
                  <div
                    className="absolute bottom-0 inset-x-0 bg-studio-forest rounded-t-lg transition-all"
                    style={{ height: `${((val * 0.65) / 150) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-studio-muted font-mono">{`W${idx + 1}`}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Bottom Split: Top Galleries & Client Platforms */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Galleries (2 cols) */}
          <Card className="p-6 bg-white border-studio-sand shadow-xs lg:col-span-2">
            <h2 className="font-serif text-lg font-semibold text-studio-charcoal mb-4">Top Performing Client Galleries</h2>
            <div className="divide-y divide-studio-sand/70">
              {mockTopGalleries.map((g) => (
                <div key={g.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-studio-charcoal">{g.name}</h3>
                    <p className="text-xs text-studio-muted mt-0.5">{g.type} Photoshoot &middot; {g.conversion} guest participation</p>
                  </div>
                  <div className="text-right flex items-center gap-6">
                    <div>
                      <p className="text-xs font-bold text-studio-charcoal font-mono">{g.views.toLocaleString()}</p>
                      <p className="text-[10px] text-studio-muted uppercase">Views</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-studio-forest font-mono">{g.downloads.toLocaleString()}</p>
                      <p className="text-[10px] text-studio-muted uppercase">Saves</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Client Platforms & Device Distribution */}
          <Card className="p-6 bg-white border-studio-sand shadow-xs">
            <h2 className="font-serif text-lg font-semibold text-studio-charcoal mb-4">Device & Access</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-studio-charcoal font-medium">Mobile QR Scans</span>
                  <span className="font-mono text-studio-forest font-bold">82%</span>
                </div>
                <div className="h-2 rounded-full bg-studio-cream overflow-hidden">
                  <div className="h-full bg-studio-forest rounded-full" style={{ width: "82%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-studio-charcoal font-medium">Desktop Web Studio</span>
                  <span className="font-mono text-[#C5A880] font-bold">18%</span>
                </div>
                <div className="h-2 rounded-full bg-studio-cream overflow-hidden">
                  <div className="h-full bg-[#C5A880] rounded-full" style={{ width: "18%" }} />
                </div>
              </div>

              <div className="pt-4 border-t border-studio-sand/70 text-xs text-studio-muted space-y-1.5">
                <div className="flex justify-between">
                  <span>Average Viewing Time:</span>
                  <span className="font-semibold text-studio-charcoal">4m 32s</span>
                </div>
                <div className="flex justify-between">
                  <span>Face Recognition Rate:</span>
                  <span className="font-semibold text-studio-forest">99.4%</span>
                </div>
                <div className="flex justify-between">
                  <span>Fastest AI Search:</span>
                  <span className="font-semibold text-studio-charcoal">124ms</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
