import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../services/api";
import { getApiBaseUrl, setApiBaseUrl } from "../services/api/client";
import { GoogleSignInButton } from "../components/auth/GoogleSignInButton";

export default function Login() {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showServerSettings, setShowServerSettings] = useState(false);
  const [customApiUrl, setCustomApiUrl] = useState(() => getApiBaseUrl());

  function handleAuthError(err: unknown, userEmail: string) {
    const msg = err instanceof ApiError ? (err.detail || err.message) : (err instanceof Error ? err.message : "Failed to sign in.");
    
    if (msg.includes("ACCOUNT_PENDING")) {
      navigate(`/account-status?email=${encodeURIComponent(userEmail)}&status=pending`);
      return;
    }
    if (msg.includes("ACCOUNT_REJECTED")) {
      navigate(`/account-status?email=${encodeURIComponent(userEmail)}&status=rejected`);
      return;
    }
    if (msg.includes("ACCOUNT_SUSPENDED")) {
      navigate(`/account-status?email=${encodeURIComponent(userEmail)}&status=suspended`);
      return;
    }
    setError(msg);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      handleAuthError(err, email);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSuccess(credential: string) {
    setError(null);
    setLoading(true);
    let fallbackEmail = "";
    if (credential.startsWith("dev-:")) {
      const parts = credential.split(":");
      if (parts[1]) fallbackEmail = parts[1];
    }
    try {
      await loginWithGoogle(credential);
      navigate("/dashboard");
    } catch (err) {
      handleAuthError(err, fallbackEmail);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to your SnapFind AI dashboard">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-400">
            {error}
          </div>
        )}

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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-xl border border-slate-700/80 bg-midnight/80 px-3.5 py-2.5 text-sm text-soft-white placeholder:text-muted/60 outline-none transition-all focus:border-gold focus:ring-1 focus:ring-gold/30 shadow-inner"
          />
        </div>

        <div className="flex items-center justify-between text-xs pt-0.5">
          <label className="flex items-center gap-2 cursor-pointer text-muted">
            <input type="checkbox" className="rounded border-slate-700 bg-midnight text-gold focus:ring-gold/30" />
            <span>Remember me</span>
          </label>
          <Link to="/forgot-password" className="text-gold font-medium hover:underline">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gold px-4 py-3 text-sm font-bold text-midnight transition-all hover:bg-gold-light active:scale-[0.99] disabled:opacity-60 shadow-md shadow-gold/20 cursor-pointer"
        >
          {loading ? "Signing in…" : "Sign In to Studio"}
        </button>

        <div className="relative my-5 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <div className="relative bg-slate-panel px-3 text-[11px] font-medium uppercase tracking-wider text-muted">
            Or continue with
          </div>
        </div>

        <GoogleSignInButton
          onSuccess={handleGoogleSuccess}
          onError={(err) => setError(err)}
          disabled={loading}
          text="signin_with"
        />
      </form>

      <p className="mt-6 text-center text-xs text-muted">
        Don't have an account?{" "}
        <Link to="/register" className="font-semibold text-gold hover:underline">
          Create a studio account
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
                placeholder="https://your-api.onrender.com"
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
              Point this to your live Render backend (e.g. <code>https://snapfind-api.onrender.com</code>) or local dev server.
            </p>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
