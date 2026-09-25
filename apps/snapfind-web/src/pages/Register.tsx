import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../services/api";
import { GoogleSignInButton } from "../components/auth/GoogleSignInButton";

export default function Register() {
  const navigate = useNavigate();
  const { register, loginWithGoogle } = useAuth();
  const [studioName, setStudioName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const createdUser = await register(studioName, email, password);
      if (createdUser.approval_status === "approved" || createdUser.role === "super_admin") {
        navigate("/dashboard");
      } else {
        navigate(`/account-status?email=${encodeURIComponent(email)}&status=pending`);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail || err.message);
      } else {
        setError("Failed to create account. Please check your information.");
      }
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
      const msg = err instanceof ApiError ? (err.detail || err.message) : (err instanceof Error ? err.message : "Google sign-up failed.");
      if (msg.includes("ACCOUNT_PENDING")) {
        navigate(`/account-status?status=pending`);
        return;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Create your studio account" subtitle="Join SnapFind Studio to organize, share, and deliver client galleries">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-xs text-red-700">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-studio-charcoal mb-1.5" htmlFor="studio">
            Studio or Photographer Name
          </label>
          <input
            id="studio"
            type="text"
            required
            value={studioName}
            onChange={(e) => setStudioName(e.target.value)}
            placeholder="Marlowe & Finch Photography"
            className="w-full rounded-xl border border-studio-sand bg-white px-3.5 py-2.5 text-sm text-studio-charcoal placeholder:text-studio-muted/60 outline-none transition-all focus:border-studio-forest focus:ring-1 focus:ring-studio-forest shadow-xs"
          />
        </div>
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
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            className="w-full rounded-xl border border-studio-sand bg-white px-3.5 py-2.5 text-sm text-studio-charcoal placeholder:text-studio-muted/60 outline-none transition-all focus:border-studio-forest focus:ring-1 focus:ring-studio-forest shadow-xs"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-studio-forest px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-studio-forest-light active:scale-[0.99] disabled:opacity-60 shadow-sm"
        >
          {loading ? "Creating studio account…" : "Register Studio Account"}
        </button>

        <div className="relative my-5 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-studio-sand" />
          </div>
          <div className="relative bg-white px-3 text-[11px] font-medium uppercase tracking-wider text-studio-muted">
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

      <p className="mt-6 text-center text-xs text-studio-muted">
        Already have a studio account?{" "}
        <Link to="/login" className="font-semibold text-studio-forest hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
