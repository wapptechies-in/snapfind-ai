import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";
import { useAuth } from "../context/AuthContext";
import { extractErrorMessage, getApiBaseUrl, setApiBaseUrl } from "../services/api";
import { GoogleSignInButton } from "../components/auth/GoogleSignInButton";

export default function Register() {
  const navigate = useNavigate();
  const { register, loginWithGoogle } = useAuth();
  const [studioName, setStudioName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showServerSettings, setShowServerSettings] = useState(false);
  const [customApiUrl, setCustomApiUrl] = useState(() => getApiBaseUrl());

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await register(studioName, email, password);
      navigate("/dashboard");
    } catch (err) {
      const msg = extractErrorMessage(err);
      setError(msg || "Failed to create account. Please check your information.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSuccess(credential: string) {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle(credential, studioName.trim() || undefined);
      navigate("/dashboard");
    } catch (err: unknown) {
      const msg = extractErrorMessage(err);
      setError(msg || "Google sign-up failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Create your studio account" subtitle="Join SnapFind Studio to organize, share, and deliver client galleries">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-400 space-y-1">
            <div>{error}</div>
            {(error.includes("404") || error.includes("Cannot reach") || error.includes("connect")) && !showServerSettings && (
              <button
                type="button"
                onClick={() => setShowServerSettings(true)}
                className="text-[11px] text-amber-400 underline hover:text-amber-300 block"
              >
                Configure Backend API Server URL
              </button>
            )}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-soft-white/90 mb-1.5" htmlFor="studio">
            Studio or Photographer Name
          </label>
          <input
            id="studio"
            type="text"
            required
            value={studioName}
            onChange={(e) => setStudioName(e.target.value)}
            placeholder="Marlowe & Finch Photography"
            className="w-full rounded-xl border border-slate-700/80 bg-midnight/80 px-3.5 py-2.5 text-sm text-soft-white placeholder:text-muted/60 outline-none transition-all focus:border-gold focus:ring-1 focus:ring-gold/30 shadow-inner"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-soft-white/90 mb-1.5" htmlFor="email">
            Email address
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="studio@example.com"
            className="w-full rounded-xl border border-slate-700/80 bg-midnight/80 px-3.5 py-2.5 text-sm text-soft-white placeholder:text-muted/60 outline-none transition-all focus:border-gold focus:ring-1 focus:ring-gold/30 shadow-inner"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-soft-white/90 mb-1.5" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            className="w-full rounded-xl border border-slate-700/80 bg-midnight/80 px-3.5 py-2.5 text-sm text-soft-white placeholder:text-muted/60 outline-none transition-all focus:border-gold focus:ring-1 focus:ring-gold/30 shadow-inner"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gold px-4 py-3 text-sm font-bold text-midnight transition-all hover:bg-gold-light active:scale-[0.99] disabled:opacity-60 shadow-md shadow-gold/20 cursor-pointer"
        >
          {loading ? "Creating studio account…" : "Register Studio Account"}
        </button>

        <div className="relative my-5 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <div className="relative bg-slate-panel px-3 text-[11px] font-medium uppercase tracking-wider text-muted">
            Or register with
          </div>
        </div>

        <GoogleSignInButton
          onSuccess={handleGoogleSuccess}
          onError={(err) => setError(err)}
          disabled={loading}
          text="signup_with"
        />
      </form>

      <p className="mt-6 text-center text-xs text-muted">
        Already have a studio account?{" "}
        <Link to="/login" className="font-semibold text-gold hover:underline">
          Sign in
        </Link>
      </p>

      {/* API Server Configuration Toggle */}
      <div className="mt-4 pt-3 border-t border-slate-800 text-center">
        <button
          type="button"
          onClick={() => setShowServerSettings(!showServerSettings)}
          className="text-[11px] text-muted hover:text-soft-white transition-colors cursor-pointer"
        >
          {showServerSettings ? "▲ Hide Server Settings" : "⚙ API Server: " + customApiUrl}
        </button>
        {showServerSettings && (
          <div className="mt-2.5 p-3 rounded-xl bg-midnight/90 border border-slate-800 text-left space-y-2 shadow-sm">
            <label className="text-[11px] font-semibold text-muted block">
              Backend API URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customApiUrl}
                onChange={(e) => setCustomApiUrl(e.target.value)}
                placeholder="https://snapfind-api-sq4a.onrender.com"
                className="flex-1 text-xs font-mono bg-slate-panel border border-slate-700 rounded-lg px-2.5 py-1.5 text-soft-white outline-none focus:border-gold"
              />
              <button
                type="button"
                onClick={() => {
                  setApiBaseUrl(customApiUrl);
                  alert(`API server URL set to: ${customApiUrl}`);
                  window.location.reload();
                }}
                className="px-3 py-1.5 rounded-lg bg-gold text-midnight text-xs font-bold hover:bg-gold-light transition-colors cursor-pointer"
              >
                Save
              </button>
            </div>
            <p className="text-[10px] text-muted">
              Point this to your live Render backend (e.g. <code>https://snapfind-api-sq4a.onrender.com</code>) or local dev server.
            </p>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
