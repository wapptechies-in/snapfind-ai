import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // MOCK: no authentication endpoint yet (Phase 2). We simulate a
    // successful login and go straight to the dashboard so the rest of
    // the app is reachable in Phase 1.
    setLoading(true);
    setTimeout(() => {
      navigate("/dashboard");
    }, 500);
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to your SnapFind AI dashboard">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-dim" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            defaultValue="photographer@example.com"
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
            defaultValue="••••••••"
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
        <p className="text-center text-[11px] text-dim">
          MOCK login — any credentials work in Phase 1. Real auth is planned.
        </p>
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
