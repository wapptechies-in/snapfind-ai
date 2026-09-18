import { useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { mockEvents } from "../services/mockData";
import type { EventStatus } from "../types";

const filters: Array<EventStatus | "all"> = ["all", "active", "processing", "completed"];

const statusStyles: Record<string, string> = {
  active: "bg-good/15 text-good",
  processing: "bg-violet/15 text-violet-light",
  completed: "bg-hairline text-dim",
};

export default function Events() {
  const [filter, setFilter] = useState<EventStatus | "all">("all");
  const events = filter === "all" ? mockEvents : mockEvents.filter((e) => e.status === filter);

  return (
    <DashboardLayout title="Events">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 text-xs capitalize transition-colors ${
                filter === f ? "bg-violet text-white" : "bg-panel2 text-dim hover:text-cloud"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <button className="rounded-lg bg-violet px-4 py-2 text-sm font-medium text-white hover:bg-violet-light">
          + New event
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {events.map((event) => (
          <div key={event.id} className="card p-5">
            <div className="flex items-start justify-between">
              <h3 className="font-medium">{event.name}</h3>
              <span className={`rounded-full px-2.5 py-1 text-xs capitalize ${statusStyles[event.status]}`}>
                {event.status}
              </span>
            </div>
            <p className="mt-1 text-xs text-dim">{event.date}</p>
            <div className="mt-4 flex items-center gap-6 text-sm">
              <div>
                <p className="text-lg font-semibold">{event.photos.toLocaleString()}</p>
                <p className="text-xs text-dim">Photos</p>
              </div>
              <div>
                <p className="text-lg font-semibold">{event.searches.toLocaleString()}</p>
                <p className="text-xs text-dim">Searches</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-6 text-xs text-dim">
        MOCK data — event creation, photo upload, and QR generation are
        planned for later phases.
      </p>
    </DashboardLayout>
  );
}
