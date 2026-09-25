import React from "react";
import { QRCodeModal as SharedQRCodeModal } from "@snapfind/ui";
import type { SnapEvent } from "../types";

export interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: SnapEvent | null;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  event,
}) => {
  return (
    <SharedQRCodeModal
      isOpen={isOpen}
      onClose={onClose}
      event={event}
    />
  );
};
