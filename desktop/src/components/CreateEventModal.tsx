import React from "react";
import { CreateEventModal as SharedCreateEventModal } from "@snapfind/ui";
import { eventsApi } from "@snapfind/api-client";
import { useApp } from "../state/store";
import type { SnapEvent } from "../types";

export interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (event: SnapEvent) => void;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const { createEvent } = useApp();

  return (
    <SharedCreateEventModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={(payload) => createEvent(payload)}
      onUploadCover={(file) => eventsApi.uploadCover(file)}
      onCreated={onCreated}
    />
  );
};
