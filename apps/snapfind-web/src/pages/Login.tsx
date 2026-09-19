import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../services/api";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("photographer@example.com");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail || err.message);
      } else {
        setError("Failed to sign in. Please verify your credentials.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to your SnapFind AI dashboard">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-400">
            {error}
          </div>
        )}

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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-hairline bg-base px-3.5 py-2.5 text-sm outline-none focus:border-violet"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-violet px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-light disabled:opacity-60"
        >
          {loading ? "Logging in…" : "Log in"}
        </button>

        <div className="rounded-lg border border-hairline bg-panel2 p-3 text-center text-[11px] text-dim">
          <p className="font-medium text-cloud">Default Demo Credentials:</p>
          <p className="mt-0.5 font-mono">photographer@example.com / password123</p>
        </div>
      </form>

      <p className="mt-6 text-center text-sm text-dim">
        Don't have an account?{" "}
        <Link to="/register" className="text-violet-light hover:text-violet">
          Register
        </Link>
      </p>
    </AuthLayout>
  );
}
