import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge, Button, Card, LoadingSpinner } from "../components/common";
import { useApp } from "../state/store";
import type { SnapEvent } from "../types";

export const EventSelect: React.FC = () => {
  const navigate = useNavigate();
  const { events, selectedEvent, setSelectedEvent, loadEvents } = useApp();
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const filtered = events.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.location?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (event: SnapEvent) => {
    setSelectedEvent(event);
    navigate("/scan");
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadEvents();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Select Destination Event</h2>
          <p className="text-xs text-dim mt-0.5">
            Choose the client event you are uploading photographs to.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3.5 py-1.5 rounded-lg border border-hairline bg-panel2 text-xs text-cloud placeholder:text-dim focus:border-violet focus:outline-none w-56"
          />
          <Button size="sm" variant="secondary" onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      {events.length === 0 ? (
        <Card className="p-12 text-center">
          <LoadingSpinner message="Loading events from studio..." />
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-xs text-dim">No events match your search term.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((evt) => {
            const isSelected = selectedEvent?.id === evt.id;

            return (
              <Card
                key={evt.id}
                className={`p-5 transition-all hover:border-violet/50 cursor-pointer ${
                  isSelected ? "border-violet bg-violet/5 shadow-lg shadow-violet/10" : ""
                }`}
                onClick={() => handleSelect(evt)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-cloud">{evt.name}</h3>
                      <Badge variant={evt.status === "Active" ? "active" : "neutral"}>
                        {evt.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-dim mt-1 font-mono">
                      📅 {evt.date} &middot; 📍 {evt.location || "Location not set"}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-violet-light">
                      {(evt.photo_count || 0).toLocaleString()}
                    </span>
                    <p className="text-[10px] text-dim">photos</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-hairline/60 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-dim">Token: {evt.public_token}</span>
                  <Button
                    size="sm"
                    variant={isSelected ? "primary" : "secondary"}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(evt);
                    }}
                  >
                    {isSelected ? "Selected ✓" : "Select & Scan Folder →"}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
