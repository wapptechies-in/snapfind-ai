import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Badge, Button, Card } from "../components/common";
import { useApp } from "../state/store";
import { UploadManager } from "../upload/uploadManager";

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, events, recentSessions, setSelectedEvent, setUploadManager } = useApp();

  const totalCloudPhotos = events.reduce((sum, e) => sum + (e.photo_count || 0), 0);
  const activeEventsCount = events.filter((e) => e.status === "Active").length;

  const handleResumeSession = (session: typeof recentSessions[0]) => {
    const matchingEvent = events.find((e) => e.id === session.eventId);
    if (matchingEvent) {
      setSelectedEvent(matchingEvent);
    }
    const manager = new UploadManager(session);
    setUploadManager(manager);
    manager.start();
    navigate("/uploads");
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-hairline bg-gradient-to-r from-panel via-panel2 to-panel p-8 shadow-sm">
        <div className="relative z-10">
          <Badge variant="active" className="mb-3">
            Studio Connected
          </Badge>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Welcome back, {user?.studio_name || "Photographer"}
          </h2>
          <p className="text-xs text-dim mt-1 max-w-2xl">
            Scan high-resolution wedding and event photo folders, batch upload directly to cloud storage,
            and monitor AI face indexing.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link to="/events">
              <Button variant="primary" size="md">
                Select Event & Upload Photos →
              </Button>
            </Link>
            <Link to="/scan">
              <Button variant="secondary" size="md">
                Scan Local Folder
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-5">
          <p className="text-xs text-dim font-medium">Total Events</p>
          <p className="text-2xl font-bold text-cloud font-mono mt-1">
            {events.length.toLocaleString()}
          </p>
          <p className="text-[11px] text-good mt-1 font-medium">{activeEventsCount} active in cloud</p>
        </Card>

        <Card className="p-5">
          <p className="text-xs text-dim font-medium">Cloud Photos</p>
          <p className="text-2xl font-bold text-cloud font-mono mt-1">
            {totalCloudPhotos.toLocaleString()}
          </p>
          <p className="text-[11px] text-dim mt-1">Indexed in pgvector</p>
        </Card>

        <Card className="p-5">
          <p className="text-xs text-dim font-medium">Recent Sessions</p>
          <p className="text-2xl font-bold text-violet-light font-mono mt-1">
            {recentSessions.length.toLocaleString()}
          </p>
          <p className="text-[11px] text-dim mt-1">Saved locally</p>
        </Card>

        <Card className="p-5">
          <p className="text-xs text-dim font-medium">Local Storage Mode</p>
          <p className="text-lg font-bold text-cloud mt-1">Direct PUT</p>
          <p className="text-[11px] text-good mt-1">Streaming bypass</p>
        </Card>
      </div>

      {/* Recent Upload Sessions */}
      <Card className="p-6">
        <div className="flex items-center justify-between pb-4 border-b border-hairline">
          <div>
            <h3 className="text-sm font-semibold text-cloud">Recent Desktop Upload Sessions</h3>
            <p className="text-xs text-dim mt-0.5">
              Recoverable upload states stored locally in application data
            </p>
          </div>
          <Link to="/events" className="text-xs text-violet-light hover:underline font-medium">
            New Upload Session
          </Link>
        </div>

        {recentSessions.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-xs text-dim">No recent desktop upload sessions found.</p>
            <Link to="/events" className="mt-3 inline-block">
              <Button size="sm" variant="secondary">
                Start First Upload
              </Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-hairline mt-2">
            {recentSessions.map((session) => {
              const isDone = session.status === "completed";
              const percent = session.totalFiles > 0
                ? Math.round((session.uploadedFiles / session.totalFiles) * 100)
                : 0;

              return (
                <div
                  key={session.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-cloud">{session.eventName}</p>
                      <Badge
                        variant={
                          isDone
                            ? "completed"
                            : session.status === "active"
                            ? "active"
                            : session.status === "paused"
                            ? "neutral"
                            : "failed"
                        }
                      >
                        {session.status.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-dim font-mono truncate max-w-lg">
                      {session.folderPath}
                    </p>
                    <p className="text-[11px] text-dim">
                      {new Date(session.updatedAt).toLocaleString()} &middot;{" "}
                      {session.uploadedFiles}/{session.totalFiles} photos uploaded ({percent}%)
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isDone && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleResumeSession(session)}
                      >
                        Resume Upload
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleResumeSession(session)}
                    >
                      View Queue
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};
