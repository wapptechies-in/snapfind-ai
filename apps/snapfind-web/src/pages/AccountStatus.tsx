import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";
import { authApi } from "../services/api/auth";

export default function AccountStatus() {
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get("status") || "pending";
  const email = searchParams.get("email") || "";

  const [status, setStatus] = useState<string>(initialStatus);
  const [checking, setChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);

  const checkStatus = async () => {
    if (!email) return;
    setChecking(true);
    setStatusMessage(null);
    try {
      const res = await authApi.checkApprovalStatus(email);
      setStatus(res.status);
      setRejectionReason(res.rejection_reason || null);
      if (res.status === "approved") {
        setStatusMessage("Great news! Your account has been approved. You can now log in.");
      } else {
        setStatusMessage(res.message || "Your application is still under review.");
      }
    } catch {
      setStatusMessage("Could not refresh status at this time. Please try again later.");
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (email) {
      checkStatus();
    }
  }, [email]);

  const isApproved = status === "approved";
  const isRejected = status === "rejected";
  const isSuspended = status === "suspended";

  return (
    <AuthLayout
      title={
        isApproved
          ? "Account Approved"
          : isRejected
          ? "Application Not Approved"
          : isSuspended
          ? "Access Suspended"
          : "Registration Under Review"
      }
      subtitle={
        isApproved
          ? "Your studio account has been verified and approved"
          : isRejected
          ? "Review outcome regarding your application"
          : isSuspended
          ? "Access currently restricted"
          : "Your access is pending administrator verification"
      }
    >
      <div className="space-y-6 text-center">
        {/* Status Indicator Icon */}
        <div className="flex justify-center">
          {isApproved ? (
            <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-3xl text-emerald-400 shadow-sm">
              ✓
            </div>
          ) : isRejected ? (
            <div className="h-16 w-16 rounded-2xl bg-coral/10 border border-coral/30 flex items-center justify-center text-3xl text-coral shadow-sm">
              ✕
            </div>
          ) : isSuspended ? (
            <div className="h-16 w-16 rounded-2xl bg-coral/10 border border-coral/30 flex items-center justify-center text-3xl text-coral shadow-sm">
              ⏸
            </div>
          ) : (
            <div className="h-16 w-16 rounded-2xl bg-gold/10 border border-gold/30 flex items-center justify-center text-3xl text-gold shadow-sm animate-pulse">
              ⏳
            </div>
          )}
        </div>

        {/* Status Copy */}
        <div className="space-y-3">
          {email && (
            <p className="text-xs font-mono text-gold bg-midnight border border-slate-800 rounded-lg py-1 px-3 inline-block">
              {email}
            </p>
          )}

          <p className="text-sm text-muted leading-relaxed max-w-sm mx-auto">
            {isApproved
              ? "Your photographer studio account is now fully approved! You have complete access to event creation, AI facial indexing, and client delivery."
              : isRejected
              ? "Thank you for your interest in SnapFind Studio. Unfortunately, your registration was not approved by our administration team at this time."
              : isSuspended
              ? "Your studio account has been temporarily suspended by a platform administrator. Please contact our support team for clarification."
              : "Thank you for registering. SnapFind Studio requires administrator review before studio accounts can access the platform. We verify all photography studio profiles to maintain security."}
          </p>

          {rejectionReason && (
            <div className="p-3.5 rounded-xl bg-coral/10 border border-coral/30 text-xs text-coral text-left space-y-1">
              <span className="font-semibold block">Reason for Rejection:</span>
              <p>{rejectionReason}</p>
            </div>
          )}

          {statusMessage && (
            <p className="text-xs text-gold font-medium pt-1">{statusMessage}</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          {isApproved ? (
            <Link to="/login" className="block w-full">
              <button className="w-full rounded-xl bg-gold px-4 py-3 text-sm font-bold text-midnight shadow-md shadow-gold/20 hover:bg-gold-light transition-all cursor-pointer">
                Proceed to Sign In →
              </button>
            </Link>
          ) : (
            <>
              {email && !isRejected && !isSuspended && (
                <button
                  type="button"
                  onClick={checkStatus}
                  disabled={checking}
                  className="w-full rounded-xl bg-gold px-4 py-3 text-sm font-bold text-midnight shadow-md shadow-gold/20 hover:bg-gold-light transition-all disabled:opacity-60 cursor-pointer"
                >
                  {checking ? "Checking Approval Status…" : "Refresh Approval Status ↻"}
                </button>
              )}

              <Link to="/login" className="block w-full">
                <button className="w-full rounded-xl border border-slate-700 bg-midnight px-4 py-2.5 text-xs font-semibold text-soft-white hover:border-gold transition-colors shadow-sm cursor-pointer">
                  Return to Sign In
                </button>
              </Link>
            </>
          )}
        </div>

        <p className="text-[11px] text-muted">
          Need immediate assistance? Contact{" "}
          <a href="mailto:support@snapfind.ai" className="text-gold font-medium underline">
            support@snapfind.ai
          </a>
        </p>
      </div>
    </AuthLayout>
  );
}
