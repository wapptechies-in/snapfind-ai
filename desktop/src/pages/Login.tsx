import React, { useState } from "react";
import { useApp } from "../state/store";
import { authApi } from "../api/auth";
import { GoogleSignInButton } from "../components/GoogleSignInButton";
import { BrandMark } from "@snapfind/ui";

interface ApprovalModalState {
  status: "pending" | "rejected" | "suspended" | "approved";
  email: string;
  message: string;
  reason?: string | null;
}

export const Login: React.FC = () => {
  const { login, loginWithGoogle, settings, updateSettings } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [apiUrl, setApiUrl] = useState(settings.apiBaseUrl);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Approval status modal state
  const [approvalModal, setApprovalModal] = useState<ApprovalModalState | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [checkResult, setCheckResult] = useState<string | null>(null);

  const handleAuthError = (err: unknown, fallbackEmail: string) => {
    const msg = err instanceof Error ? err.message : "Authentication failed";
    if (msg.includes("ACCOUNT_PENDING")) {
      const detail = msg.replace("ACCOUNT_PENDING:", "").trim() || "Your registration request is pending administrator approval.";
      setApprovalModal({
        status: "pending",
        email: fallbackEmail,
        message: detail,
      });
      return;
    }
    if (msg.includes("ACCOUNT_REJECTED")) {
      const detail = msg.replace("ACCOUNT_REJECTED:", "").trim() || "Your registration request was not approved.";
      setApprovalModal({
        status: "rejected",
        email: fallbackEmail,
        message: detail,
      });
      return;
    }
    if (msg.includes("ACCOUNT_SUSPENDED")) {
      const detail = msg.replace("ACCOUNT_SUSPENDED:", "").trim() || "Your account has been temporarily suspended.";
      setApprovalModal({
        status: "suspended",
        email: fallbackEmail,
        message: detail,
      });
      return;
    }
    setError(msg);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      updateSettings({ apiBaseUrl: apiUrl });
      await login(email, password);
    } catch (err: unknown) {
      handleAuthError(err, email);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credential: string) => {
    setLoading(true);
    setError(null);
    let potentialEmail = "your Google account";
    if (credential.startsWith("dev-:")) {
      const parts = credential.split(":");
      if (parts[1]) potentialEmail = parts[1];
    }
    try {
      updateSettings({ apiBaseUrl: apiUrl });
      await loginWithGoogle(credential);
    } catch (err: unknown) {
      handleAuthError(err, potentialEmail);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!approvalModal?.email) return;
    setCheckingStatus(true);
    setCheckResult(null);
    try {
      const res = await authApi.checkApprovalStatus(approvalModal.email);
      setApprovalModal((prev) =>
        prev
          ? {
              ...prev,
              status: (res.status as ApprovalModalState["status"]) || prev.status,
              reason: res.rejection_reason || prev.reason,
            }
          : null
      );
      if (res.status === "approved") {
        setCheckResult("Your account has been approved! You can now log in.");
      } else {
        setCheckResult(res.message || `Status is currently: ${res.status}`);
      }
    } catch {
      setCheckResult("Could not verify status. Please ensure server is reachable.");
    } finally {
      setCheckingStatus(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-screen items-center justify-center overflow-hidden bg-studio-ivory p-6 select-none font-sans text-studio-charcoal">
      {/* Decorative Warm Ambient Glow */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-studio-champagne/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-studio-sage/15 blur-3xl" />

      <div className="relative z-10 w-full max-w-5xl rounded-[32px] border border-studio-sand bg-white/80 p-3 shadow-xl backdrop-blur-xl md:p-5">
        <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
          {/* Editorial Photography Panel */}
          <div className="relative overflow-hidden rounded-[26px] bg-studio-forest p-8 md:p-10 text-white flex flex-col justify-between min-h-[520px]">
            {/* Background luxury photo overlay */}
            <div
              className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-overlay"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80')`,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-studio-forest via-studio-forest/70 to-studio-forest/30" />

            <div className="relative z-10 space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-medium tracking-wide backdrop-blur-md border border-white/15">
                <span className="h-1.5 w-1.5 rounded-full bg-studio-champagne animate-pulse" />
                <span className="text-studio-sand text-[11px] uppercase tracking-wider">Desktop Studio Station</span>
              </div>

              <h1 className="font-serif text-3xl font-semibold leading-tight text-white md:text-4xl">
                Every moment, <br />
                <span className="italic font-normal text-studio-champagne">effortlessly found.</span>
              </h1>

              <p className="max-w-md text-xs leading-relaxed text-studio-sand/80">
                Direct camera folder scanning, high-speed background syncing, and AI facial indexing tailored for professional studio operations.
              </p>
            </div>

            <div className="relative z-10 grid grid-cols-3 gap-3 pt-6 border-t border-white/15">
              <div className="rounded-xl bg-white/5 p-3 backdrop-blur-sm border border-white/10 text-center">
                <div className="font-serif text-xl font-medium text-studio-champagne">Instant</div>
                <div className="text-[10px] text-studio-sand/70 uppercase tracking-wider mt-0.5">Folder Scan</div>
              </div>
              <div className="rounded-xl bg-white/5 p-3 backdrop-blur-sm border border-white/10 text-center">
                <div className="font-serif text-xl font-medium text-studio-champagne">AI</div>
                <div className="text-[10px] text-studio-sand/70 uppercase tracking-wider mt-0.5">Face Index</div>
              </div>
              <div className="rounded-xl bg-white/5 p-3 backdrop-blur-sm border border-white/10 text-center">
                <div className="font-serif text-xl font-medium text-studio-champagne">Cloud</div>
                <div className="text-[10px] text-studio-sand/70 uppercase tracking-wider mt-0.5">Sync Queue</div>
              </div>
            </div>
          </div>

          {/* Form Panel */}
          <div className="flex flex-col justify-center px-4 py-2 sm:px-6">
            <div className="mb-6">
              <BrandMark size="lg" className="mb-4" />
              <h2 className="font-serif text-2xl font-semibold text-studio-charcoal">Sign In to Studio</h2>
              <p className="mt-1 text-xs text-studio-muted">Access your desktop event scanning and sync hub</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-xs text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-studio-charcoal mb-1.5">
                  Studio Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="photographer@studio.com"
                  className="w-full rounded-xl border border-studio-sand bg-white px-3.5 py-2.5 text-sm text-studio-charcoal placeholder:text-studio-muted/60 outline-none transition-all focus:border-studio-forest focus:ring-1 focus:ring-studio-forest shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-studio-charcoal mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-studio-sand bg-white px-3.5 py-2.5 text-sm text-studio-charcoal placeholder:text-studio-muted/60 outline-none transition-all focus:border-studio-forest focus:ring-1 focus:ring-studio-forest shadow-xs"
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-0.5">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-[11px] text-studio-muted hover:text-studio-forest transition-colors font-medium flex items-center gap-1"
                >
                  <span>{showAdvanced ? "▾" : "▸"}</span> Server Endpoint
                </button>
              </div>

              {showAdvanced && (
                <div className="rounded-xl border border-studio-sand bg-studio-cream/50 p-3 animate-fade-in">
                  <label className="block text-[11px] font-semibold text-studio-muted mb-1">
                    API Endpoint URL
                  </label>
                  <input
                    type="text"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    className="w-full rounded-lg border border-studio-sand bg-white px-3 py-1.5 font-mono text-xs text-studio-charcoal focus:border-studio-forest focus:outline-none"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-studio-forest px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-studio-forest-light active:scale-[0.99] transition-all disabled:opacity-60"
              >
                {loading ? "Authenticating…" : "Sign In to Studio"}
              </button>

              <div className="relative my-4 flex items-center justify-center">
                <div className="w-full border-t border-studio-sand" />
                <div className="absolute bg-white px-3 text-[10px] font-medium uppercase tracking-wider text-studio-muted">
                  Or sign in with
                </div>
              </div>

              <GoogleSignInButton
                onSuccess={handleGoogleSuccess}
                onError={(err) => setError(err)}
                disabled={loading}
                text="signin_with"
              />
            </form>
          </div>
        </div>
      </div>

      {/* Access Control Approval Status Modal */}
      {approvalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-studio-sand bg-white p-6 shadow-2xl">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-studio-cream border border-studio-sand text-2xl">
                {approvalModal.status === "approved"
                  ? "✅"
                  : approvalModal.status === "pending"
                  ? "⏳"
                  : "⛔"}
              </div>

              <h3 className="font-serif text-lg font-semibold text-studio-charcoal">
                {approvalModal.status === "approved"
                  ? "Account Approved!"
                  : approvalModal.status === "pending"
                  ? "Registration Under Review"
                  : approvalModal.status === "rejected"
                  ? "Registration Denied"
                  : "Account Suspended"}
              </h3>

              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wider bg-studio-cream text-studio-forest border border-studio-sand">
                Status: {approvalModal.status}
              </div>

              <p className="mt-3 text-xs text-studio-muted leading-relaxed">
                {approvalModal.message}
              </p>

              {approvalModal.reason && (
                <div className="mt-3 rounded-xl border border-red-200 bg-red-50/80 p-3 text-xs text-red-700 text-left">
                  <span className="font-semibold block mb-0.5">Administrator Note:</span>
                  <span className="italic">{approvalModal.reason}</span>
                </div>
              )}

              {checkResult && (
                <div className="mt-3 rounded-xl border border-studio-sand bg-studio-cream p-3 text-xs text-studio-forest font-medium">
                  {checkResult}
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleCheckStatus}
                disabled={checkingStatus}
                className="w-full rounded-xl bg-studio-forest py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-studio-forest-light transition-all disabled:opacity-60"
              >
                {checkingStatus ? "Verifying with server…" : "Refresh Approval Status"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setApprovalModal(null);
                  setCheckResult(null);
                }}
                className="w-full rounded-xl border border-studio-sand bg-studio-cream py-2 text-xs font-medium text-studio-charcoal hover:border-studio-forest transition-colors"
              >
                Return to Sign In
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
