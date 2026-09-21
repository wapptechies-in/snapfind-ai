import type { LocalUploadSession } from "../types";

export const sessionStorage = {
  async save(session: LocalUploadSession): Promise<boolean> {
    try {
      if (window.desktopAPI) {
        return await window.desktopAPI.saveUploadSession(session as unknown as Record<string, unknown>);
      }
      localStorage.setItem(`snapfind_session_${session.id}`, JSON.stringify(session));
      return true;
    } catch (err) {
      console.error("Failed to save local upload session:", err);
      return false;
    }
  },

  async load(sessionId: string): Promise<LocalUploadSession | null> {
    try {
      if (window.desktopAPI) {
        const data = await window.desktopAPI.loadUploadSession(sessionId);
        return data as unknown as LocalUploadSession | null;
      }
      const raw = localStorage.getItem(`snapfind_session_${sessionId}`);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      console.error(`Failed to load local upload session ${sessionId}:`, err);
      return null;
    }
  },

  async list(): Promise<LocalUploadSession[]> {
    try {
      if (window.desktopAPI) {
        const list = await window.desktopAPI.listUploadSessions();
        return list as unknown as LocalUploadSession[];
      }
      const sessions: LocalUploadSession[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("snapfind_session_")) {
          const raw = localStorage.getItem(key);
          if (raw) sessions.push(JSON.parse(raw));
        }
      }
      return sessions;
    } catch {
      return [];
    }
  },

  async delete(sessionId: string): Promise<boolean> {
    try {
      if (window.desktopAPI) {
        return await window.desktopAPI.deleteUploadSession(sessionId);
      }
      localStorage.removeItem(`snapfind_session_${sessionId}`);
      return true;
    } catch {
      return false;
    }
  },
};
