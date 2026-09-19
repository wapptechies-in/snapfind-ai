import React from "react";
import { Link } from "react-router-dom";
import { Badge, Button, Card } from "../common";
import type { SnapEvent } from "../../types";

interface EventCardProps {
  event: SnapEvent;
  onManage?: (id: string) => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event }) => {
  return (
    <Card hover className="overflow-hidden flex flex-col justify-between group">
      <div>
        {/* Cover Image Banner */}
        <div className="relative h-44 w-full overflow-hidden bg-panel2">
          <img
            src={event.coverImage}
            alt={event.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute top-2.5 left-2.5">
            <Badge variant={event.status}>{event.status}</Badge>
          </div>
          <div className="absolute top-2.5 right-2.5">
            <span className="rounded-md bg-black/65 backdrop-blur-sm px-2 py-0.5 text-[10px] font-medium text-white">
              {event.eventType}
            </span>
          </div>
        </div>

        {/* Content Details */}
        <div className="p-4">
          <h3 className="font-semibold text-sm text-cloud line-clamp-1 group-hover:text-violet-light transition-colors">
            {event.name}
          </h3>
          <p className="mt-1 text-xs text-dim flex items-center gap-1.5">
            <span>📅</span> {event.date}
          </p>
          <p className="text-xs text-dim truncate mt-0.5 flex items-center gap-1.5">
            <span>📍</span> {event.location}
          </p>
        </div>
      </div>

      {/* Footer Info & Actions */}
      <div className="p-4 pt-0">
        <div className="pt-3 border-t border-hairline flex items-center justify-between text-xs">
          <div className="text-dim">
            <span className="font-semibold text-cloud">{event.photoCount.toLocaleString()}</span> photos
          </div>
          <div className="flex items-center gap-2">
            <Link to={`/events/${event.id}`}>
              <Button size="sm" variant="secondary">
                Manage
              </Button>
            </Link>
            <Link to={`/event/${event.token}`} target="_blank">
              <Button size="sm" variant="outline" title="Open Customer Gallery">
                Gallery ↗
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
};

