import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../services/api";
import { GoogleSignInButton } from "../components/auth/GoogleSignInButton";

export default function Login() {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          <div className="rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-xs text-red-700">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-studio-charcoal mb-1.5" htmlFor="email">
            Email address
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="studio@example.com"
            className="w-full rounded-xl border border-studio-sand bg-white px-3.5 py-2.5 text-sm text-studio-charcoal placeholder:text-studio-muted/60 outline-none transition-all focus:border-studio-forest focus:ring-1 focus:ring-studio-forest shadow-xs"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-studio-charcoal mb-1.5" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-xl border border-studio-sand bg-white px-3.5 py-2.5 text-sm text-studio-charcoal placeholder:text-studio-muted/60 outline-none transition-all focus:border-studio-forest focus:ring-1 focus:ring-studio-forest shadow-xs"
          />
        </div>

        <div className="flex items-center justify-between text-xs pt-0.5">
          <label className="flex items-center gap-2 cursor-pointer text-studio-muted">
            <input type="checkbox" className="rounded border-studio-sand text-studio-forest focus:ring-studio-forest" />
            <span>Remember me</span>
          </label>
          <Link to="/forgot-password" className="text-studio-forest font-medium hover:underline">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-studio-forest px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-studio-forest-light active:scale-[0.99] disabled:opacity-60 shadow-sm"
        >
          {loading ? "Signing in…" : "Sign In to Studio"}
        </button>

        <div className="relative my-5 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-studio-sand" />
          </div>
          <div className="relative bg-white px-3 text-[11px] font-medium uppercase tracking-wider text-studio-muted">
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

      <p className="mt-6 text-center text-xs text-studio-muted">
        Don't have an account?{" "}
        <Link to="/register" className="font-semibold text-studio-forest hover:underline">
          Create a studio account
        </Link>
      </p>
    </AuthLayout>
  );
}
