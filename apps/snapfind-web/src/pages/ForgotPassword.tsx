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
          <div className="rounded-xl border border-studio-sage/30 bg-studio-sage/10 p-4 text-xs text-studio-forest leading-relaxed">
            If an account with that email exists, password reset instructions have been dispatched. Please check your inbox or spam folder within a few minutes.
          </div>
          <Link
            to="/login"
            className="block w-full text-center rounded-xl bg-studio-cream border border-studio-sand px-4 py-3 text-xs font-semibold text-studio-charcoal hover:border-studio-forest transition-colors shadow-xs"
          >
            Return to Sign In
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-xs text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-studio-charcoal mb-1.5" htmlFor="email">
              Studio email address
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

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-studio-forest px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-studio-forest-light active:scale-[0.99] disabled:opacity-60 shadow-sm"
          >
            {loading ? "Sending reset link…" : "Send Reset Link"}
          </button>

          <p className="mt-4 text-center text-xs text-studio-muted">
            Remembered your credentials?{" "}
            <Link to="/login" className="font-semibold text-studio-forest hover:underline">
              Back to Sign In
            </Link>
          </p>
        </form>
      )}
    </AuthLayout>
  );
}
