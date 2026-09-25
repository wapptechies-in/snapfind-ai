export interface TokenStorageAdapter {
  getToken(): string | null;
  setToken(token: string | null): void;
}

export class LocalStorageTokenAdapter implements TokenStorageAdapter {
  private primaryKey: string;
  private fallbackKeys: string[];

  constructor(primaryKey = "snapfind_token", fallbackKeys: string[] = ["snapfind_desktop_token", "snapfind_auth_session"]) {
    this.primaryKey = primaryKey;
    this.fallbackKeys = fallbackKeys;
  }

  getToken(): string | null {
    if (typeof window === "undefined" || !window.localStorage) return null;
    
    // Try primary key
    const primary = this.readKey(this.primaryKey);
    if (primary) return primary;

    // Try fallbacks
    for (const key of this.fallbackKeys) {
      const val = this.readKey(key);
      if (val) return val;
    }
    return null;
  }

  setToken(token: string | null): void {
    if (typeof window === "undefined" || !window.localStorage) return;
    if (token) {
      localStorage.setItem(this.primaryKey, token);
    } else {
      localStorage.removeItem(this.primaryKey);
      for (const key of this.fallbackKeys) {
        localStorage.removeItem(key);
      }
    }
  }

  private readKey(key: string): string | null {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      if (!raw.startsWith("{")) return raw;
      const parsed = JSON.parse(raw);
      return parsed.access_token || parsed.token || null;
    } catch {
      return null;
    }
  }
}

export const defaultTokenStorage = new LocalStorageTokenAdapter();

