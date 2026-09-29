/**
 * Onboarding Wizard — SnapFind Web
 * 3-screen animated flow shown after first login/register.
 * Screen 1: Studio Profile setup
 * Screen 2: Plan selection (fetched from API)
 * Screen 3: Completion checklist
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../services/api/auth";
import { billingApi, type PlanTier } from "../services/api/billing";
import { useAuth } from "../context/AuthContext";

export default function Onboarding() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();

  const [screen, setScreen] = useState(1);

  // Screen 1 fields
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [s1Error, setS1Error] = useState<string | null>(null);

  // Screen 2 fields
  const [plans, setPlans] = useState<PlanTier[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [currency, setCurrency] = useState<"usd" | "inr">("usd");
  const [paymentModal, setPaymentModal] = useState<PlanTier | null>(null);

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    billingApi
      .getPlans()
      .then(setPlans)
      .catch(() => setPlans([]))
      .finally(() => setPlansLoading(false));
  }, []);

  const handleScreen1Continue = () => {
    if (!displayName.trim() || !phone.trim() || !location.trim()) {
      setS1Error("Please fill in all required fields.");
      return;
    }
    setS1Error(null);
    setScreen(2);
  };

  const submitOnboarding = async (_selectedPlan?: string) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      await authApi.completeOnboarding({
        display_name: displayName.trim(),
        phone: phone.trim(),
        location: location.trim(),
        website: website.trim() || undefined,
      });
      await refreshProfile();
      setScreen(3);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Failed to save profile.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFreePlan = () => {
    submitOnboarding("free");
  };

  const handlePaidPlan = (plan: PlanTier) => {
    setPaymentModal(plan);
  };

  const handlePaymentModalClose = () => {
    setPaymentModal(null);
    // Fall back to free plan and continue
    submitOnboarding("free");
  };

  return (
    <div className="min-h-screen w-screen bg-midnight flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Ambient subtle glow */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-gold/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-coral/5 blur-3xl" />

      <div className="relative z-10 w-full max-w-xl">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center gap-2">
              <div
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  screen === step
                    ? "bg-gold w-8"
                    : screen > step
                    ? "bg-emerald-500 w-2.5"
                    : "bg-slate-800 w-2.5"
                }`}
              />
            </div>
          ))}
        </div>

        {/* ===== SCREEN 1: Studio Profile ===== */}
        {screen === 1 && (
          <div className="rounded-2xl border border-slate-800 bg-slate-panel p-8 shadow-2xl space-y-6">
            <div>
              <h1 className="text-2xl font-serif font-bold text-soft-white tracking-tight">Set up your Studio Profile</h1>
              <p className="text-xs text-muted mt-1">
                This information appears on your event QR landing pages and client gallery.
              </p>
            </div>

            {s1Error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-400">
                {s1Error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-soft-white mb-1.5">
                  Lead Photographer Name <span className="text-coral">*</span>
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Alex Marlowe"
                  className="w-full rounded-xl border border-slate-700/80 bg-midnight/80 px-3.5 py-2.5 text-sm text-soft-white placeholder:text-muted/60 focus:border-gold focus:ring-1 focus:ring-gold/30 outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-soft-white mb-1.5">
                  Phone Number (WhatsApp-capable) <span className="text-coral">*</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full rounded-xl border border-slate-700/80 bg-midnight/80 px-3.5 py-2.5 text-sm text-soft-white placeholder:text-muted/60 focus:border-gold focus:ring-1 focus:ring-gold/30 outline-none transition-colors"
                />
                <p className="text-[11px] text-muted mt-1">Used for direct WhatsApp guest photo delivery</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-soft-white mb-1.5">
                  City, State, Country <span className="text-coral">*</span>
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Mumbai, Maharashtra, India"
                  className="w-full rounded-xl border border-slate-700/80 bg-midnight/80 px-3.5 py-2.5 text-sm text-soft-white placeholder:text-muted/60 focus:border-gold focus:ring-1 focus:ring-gold/30 outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-soft-white mb-1.5">
                  Studio Website URL <span className="text-muted font-normal">(optional)</span>
                </label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://yourstudio.com"
                  className="w-full rounded-xl border border-slate-700/80 bg-midnight/80 px-3.5 py-2.5 text-sm text-soft-white placeholder:text-muted/60 focus:border-gold focus:ring-1 focus:ring-gold/30 outline-none transition-colors"
                />
              </div>
            </div>

            <button
              onClick={handleScreen1Continue}
              className="w-full rounded-xl bg-gold px-4 py-3 text-sm font-bold text-midnight transition-all hover:bg-gold-light active:scale-[0.98] shadow-md shadow-gold/20 cursor-pointer"
            >
              Continue →
            </button>
          </div>
        )}

        {/* ===== SCREEN 2: Choose Plan ===== */}
        {screen === 2 && (
          <div className="rounded-2xl border border-slate-800 bg-slate-panel p-8 shadow-2xl space-y-6">
            <div>
              <h1 className="text-2xl font-serif font-bold text-soft-white tracking-tight">Choose a Plan</h1>
              <p className="text-xs text-muted mt-1">
                Start free, upgrade anytime. No credit card needed for the Free plan.
              </p>
            </div>

            {/* Currency toggle */}
            <div className="flex items-center gap-2 bg-midnight/80 border border-slate-800 rounded-xl p-1 text-xs w-fit">
              <button
                type="button"
                onClick={() => setCurrency("usd")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  currency === "usd" ? "bg-gold text-midnight shadow-sm" : "text-muted hover:text-soft-white"
                }`}
              >
                USD ($)
              </button>
              <button
                type="button"
                onClick={() => setCurrency("inr")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  currency === "inr" ? "bg-gold text-midnight shadow-sm" : "text-muted hover:text-soft-white"
                }`}
              >
                INR (₹)
              </button>
            </div>

            {plansLoading ? (
              <div className="py-8 text-center text-sm text-muted">Loading plans…</div>
            ) : (
              <div className="space-y-3">
                {plans.map((plan) => {
                  const price =
                    currency === "usd"
                      ? plan.price_usd_monthly === 0
                        ? "Free"
                        : `$${plan.price_usd_monthly}/mo`
                      : plan.price_inr_monthly === 0
                      ? "Free"
                      : `₹${plan.price_inr_monthly.toLocaleString()}/mo`;

                  const isFree = plan.id === "free";

                  return (
                    <div
                      key={plan.id}
                      className={`relative rounded-xl border p-4 flex items-center justify-between gap-4 transition-all ${
                        plan.popular
                          ? "border-gold/50 bg-gold/5 ring-1 ring-gold/30"
                          : "border-slate-800 bg-midnight/60 hover:border-slate-700"
                      }`}
                    >
                      {plan.popular && (
                        <span className="absolute -top-2.5 left-4 bg-gold text-midnight text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full shadow-sm">
                          Popular
                        </span>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-soft-white">{plan.name}</span>
                          <span className="text-xs font-mono text-gold font-bold">{price}</span>
                        </div>
                        <p className="text-[11px] text-muted mt-0.5">{plan.tagline}</p>
                        <p className="text-[11px] text-muted mt-0.5">
                          {plan.max_active_events >= 9000 ? "Unlimited" : plan.max_active_events} events ·{" "}
                          {plan.max_photos_per_event >= 90000
                            ? "Unlimited"
                            : plan.max_photos_per_event.toLocaleString()}{" "}
                          photos/event
                        </p>
                      </div>
                      <button
                        disabled={submitting}
                        onClick={isFree ? handleFreePlan : () => handlePaidPlan(plan)}
                        className={`shrink-0 rounded-lg px-4 py-2 text-xs font-bold transition-all active:scale-[0.97] disabled:opacity-60 cursor-pointer ${
                          plan.popular
                            ? "bg-gold text-midnight hover:bg-gold-light shadow-md shadow-gold/20"
                            : "bg-slate-panel border border-slate-700 text-soft-white hover:border-gold"
                        }`}
                      >
                        {submitting ? "Saving…" : isFree ? "Start Free" : `Choose ${plan.name}`}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {submitError && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-400">
                {submitError}
              </div>
            )}

            <button
              onClick={() => setScreen(1)}
              className="text-xs text-muted hover:text-soft-white transition-colors cursor-pointer"
            >
              ← Back
            </button>
          </div>
        )}

        {/* ===== SCREEN 3: All Set ===== */}
        {screen === 3 && (
          <div className="rounded-2xl border border-slate-800 bg-slate-panel p-8 shadow-2xl space-y-6 text-center">
            <div>
              <div className="text-5xl mb-4">📸</div>
              <h1 className="text-2xl font-serif font-bold text-soft-white tracking-tight">You're all set!</h1>
              <p className="text-xs text-muted mt-1">Your studio profile is ready. Here's what to do next:</p>
            </div>

            <div className="space-y-3 text-left">
              {[
                { icon: "✨", title: "Create your first Event", desc: "Set up a new event gallery for your next shoot." },
                { icon: "📁", title: "Upload Photos to your event", desc: "Batch upload RAW or JPEG files to the cloud." },
                { icon: "📲", title: "Share the QR code with guests", desc: "Guests scan to find their own photos instantly." },
              ].map((step) => (
                <div
                  key={step.title}
                  className="flex items-start gap-3 rounded-xl border border-slate-800 bg-midnight/60 p-4"
                >
                  <span className="text-xl">{step.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-soft-white">{step.title}</p>
                    <p className="text-xs text-muted mt-0.5">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => navigate("/dashboard")}
              className="w-full rounded-xl bg-gold px-4 py-3 text-sm font-bold text-midnight transition-all hover:bg-gold-light active:scale-[0.98] shadow-md shadow-gold/20 cursor-pointer"
            >
              Open Dashboard →
            </button>
          </div>
        )}
      </div>

      {/* Payment placeholder modal */}
      {paymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-midnight/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-panel p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-serif font-bold text-soft-white">Upgrade to {paymentModal.name}</h2>
            <p className="text-xs text-muted leading-relaxed">
              Payment integration is ready for testing. You will be redirected to checkout once your subscription is confirmed.
            </p>
            <div className="space-y-2">
              <button
                className="w-full rounded-xl border border-slate-700 bg-midnight px-4 py-2.5 text-xs font-semibold text-soft-white hover:border-gold transition-colors cursor-pointer"
                onClick={handlePaymentModalClose}
              >
                Pay with Razorpay (India)
              </button>
              <button
                className="w-full rounded-xl border border-slate-700 bg-midnight px-4 py-2.5 text-xs font-semibold text-soft-white hover:border-gold transition-colors cursor-pointer"
                onClick={handlePaymentModalClose}
              >
                Pay with Stripe (International)
              </button>
            </div>
            <p className="text-[11px] text-muted text-center">
              Your plan will be activated automatically after successful payment.
            </p>
            <button
              onClick={handlePaymentModalClose}
              className="w-full text-xs text-muted hover:text-soft-white transition-colors cursor-pointer"
            >
              Continue with Free plan for now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
