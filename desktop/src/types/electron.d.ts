import type { DesktopAPI } from "../electron/preload";

declare global {
  interface Window {
    desktopAPI?: DesktopAPI;
  }
}

export {};
