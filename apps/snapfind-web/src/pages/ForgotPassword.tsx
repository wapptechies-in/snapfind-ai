import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";
import { authApi } from "../services/api/auth";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setError(null);
    setLoading(true);

    try {
      await authApi.forgotPassword(email.trim());
      setSubmitted(true);
    } catch {
      setError("Unable to process request. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Reset your password" subtitle="Enter your email to receive recovery instructions">
      {submitted ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-400 leading-relaxed">
            If an account with that email exists, password reset instructions have been dispatched. Please check your inbox or spam folder within a few minutes.
          </div>
          <Link
            to="/login"
            className="block w-full text-center rounded-xl bg-slate-panel border border-slate-700 px-4 py-3 text-xs font-semibold text-soft-white hover:border-gold transition-colors shadow-sm"
          >
            Return to Sign In
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-soft-white/90 mb-1.5" htmlFor="email">
              Studio email address
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

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gold px-4 py-3 text-sm font-bold text-midnight transition-all hover:bg-gold-light active:scale-[0.99] disabled:opacity-60 shadow-md shadow-gold/20 cursor-pointer"
          >
            {loading ? "Sending reset link…" : "Send Reset Link"}
          </button>

          <p className="mt-4 text-center text-xs text-muted">
            Remembered your credentials?{" "}
            <Link to="/login" className="font-semibold text-gold hover:underline">
              Back to Sign In
            </Link>
          </p>
        </form>
      )}
    </AuthLayout>
  );
}
