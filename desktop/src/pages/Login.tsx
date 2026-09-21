import React, { useState } from "react";
import { Button, Card } from "../components/common";
import { useApp } from "../state/store";

export const Login: React.FC = () => {
  const { login, settings, updateSettings } = useApp();
  const [email, setEmail] = useState("demo@snapfind.ai");
  const [password, setPassword] = useState("snapfind123");
  const [apiUrl, setApiUrl] = useState(settings.apiBaseUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      updateSettings({ apiBaseUrl: apiUrl });
      await login(email, password);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-base p-6 select-none">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 rounded-2xl bg-gradient-to-tr from-violet to-violet-light items-center justify-center text-xl font-bold text-white shadow-lg shadow-violet/20 mb-3">
            SF
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">SnapFind AI</h1>
          <p className="text-xs text-dim mt-1">Desktop Photo Processing & Upload Agent</p>
        </div>

        <Card className="p-8 border-hairline/80 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg border border-bad/30 bg-bad/10 text-xs text-bad">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-cloud mb-1.5">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="photographer@studio.com"
                className="w-full px-3.5 py-2.5 rounded-lg border border-hairline bg-panel2 text-cloud placeholder:text-dim text-xs focus:border-violet focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-cloud mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg border border-hairline bg-panel2 text-cloud placeholder:text-dim text-xs focus:border-violet focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-dim mb-1">
                API Endpoint URL
              </label>
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-hairline bg-panel2/60 text-dim text-[11px] font-mono focus:border-violet focus:outline-none transition-colors"
              />
            </div>

            <Button
              type="submit"
              size="lg"
              variant="primary"
              disabled={loading}
              className="w-full mt-2"
            >
              {loading ? "Authenticating..." : "Sign In to Studio"}
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-hairline flex items-center justify-between text-[11px] text-dim">
            <span>Demo: demo@snapfind.ai / snapfind123</span>
            <span className="font-mono">v0.1.0</span>
          </div>
        </Card>
      </div>
    </div>
  );
};
