import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // MOCK: no registration endpoint yet (Phase 2).
    setLoading(true);
    setTimeout(() => {
      navigate("/dashboard");
    }, 500);
  }

  return (
    <AuthLayout title="Create your account" subtitle="Start managing your events on SnapFind AI">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-dim" htmlFor="studio">
            Studio name
          </label>
          <input
            id="studio"
            type="text"
            required
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
            placeholder="At least 8 characters"
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
        <p className="text-center text-[11px] text-dim">
          MOCK registration — nothing is saved to a database in Phase 1.
        </p>
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
