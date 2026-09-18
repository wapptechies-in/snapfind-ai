import DashboardLayout from "../layouts/DashboardLayout";
import { mockEvents, mockSummary } from "../services/mockData";

const cards = [
  { label: "Total Events", value: mockSummary.totalEvents.toLocaleString() },
  { label: "Total Photos", value: mockSummary.totalPhotos.toLocaleString() },
  { label: "Active Events", value: mockSummary.activeEvents.toLocaleString() },
  { label: "Photo Searches", value: mockSummary.photoSearches.toLocaleString() },
  { label: "Downloads", value: mockSummary.downloads.toLocaleString() },
];

const statusStyles: Record<string, string> = {
  active: "bg-good/15 text-good",
  processing: "bg-violet/15 text-violet-light",
  completed: "bg-hairline text-dim",
};

export default function Dashboard() {
  return (
    <DashboardLayout title="Dashboard">
      <div className="mb-6 flex items-center gap-2 rounded-lg border border-hairline bg-panel2 px-4 py-2.5 text-xs text-dim">
        <span className="rounded bg-violet/20 px-1.5 py-0.5 text-[10px] font-medium text-violet-light">MOCK</span>
        These numbers are placeholder data — nothing here is read from a
        real database yet.
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {cards.map((card) => (
          <div key={card.label} className="card p-5">
            <p className="text-xs text-dim">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="card mt-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
          <h2 className="text-sm font-semibold">Recent events</h2>
          <span className="text-xs text-dim">Showing {mockEvents.length} of {mockSummary.totalEvents}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs text-dim">
                <th className="px-5 py-3 font-medium">Event</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Photos</th>
                <th className="px-5 py-3 font-medium">Searches</th>
              </tr>
            </thead>
            <tbody>
              {mockEvents.map((event) => (
                <tr key={event.id} className="border-t border-hairline">
                  <td className="px-5 py-3.5 font-medium">{event.name}</td>
                  <td className="px-5 py-3.5 text-dim">{event.date}</td>
                  <td className="px-5 py-3.5">
                    <span className={`rounded-full px-2.5 py-1 text-xs capitalize ${statusStyles[event.status]}`}>
                      {event.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-dim">{event.photos.toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-dim">{event.searches.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
