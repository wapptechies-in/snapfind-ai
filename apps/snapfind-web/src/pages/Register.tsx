import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../services/api";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
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
      await register(studioName, email, password);
      navigate("/dashboard");
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

  return (
    <AuthLayout title="Create your account" subtitle="Start managing your events on SnapFind AI">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-400">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs text-dim" htmlFor="studio">
            Studio name
          </label>
          <input
            id="studio"
            type="text"
            required
            value={studioName}
            onChange={(e) => setStudioName(e.target.value)}
            placeholder="Marlowe & Finch Photography"
            className="mt-1.5 w-full rounded-lg border border-hairline bg-base px-3.5 py-2.5 text-sm outline-none focus:border-violet"
          />
        </div>
        <div>
          <label className="block text-xs text-dim" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@studio.com"
            className="mt-1.5 w-full rounded-lg border border-hairline bg-base px-3.5 py-2.5 text-sm outline-none focus:border-violet"
          />
        </div>
        <div>
          <label className="block text-xs text-dim" htmlFor="password">
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
            className="mt-1.5 w-full rounded-lg border border-hairline bg-base px-3.5 py-2.5 text-sm outline-none focus:border-violet"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-violet px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-light disabled:opacity-60"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-dim">
        Already have an account?{" "}
        <Link to="/login" className="text-violet-light hover:text-violet">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
