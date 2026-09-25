import React from "react";
import { CreateEventModal as SharedCreateEventModal } from "@snapfind/ui";
import { eventsApi } from "../../services/api";
import type { SnapEvent } from "../../types";

export interface QuickCreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (event: SnapEvent) => void;
}

export const QuickCreateEventModal: React.FC<QuickCreateEventModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  return (
    <SharedCreateEventModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={(payload) => eventsApi.create(payload)}
      onUploadCover={(file) => eventsApi.uploadCover(file)}
      onCreated={onSuccess}
    />
  );
};
