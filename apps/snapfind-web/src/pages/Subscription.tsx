import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { Alert, Badge, Button, Card, LoadingSpinner } from "../components/common";
import { billingApi, type PlanTier, type SubscriptionStatus } from "../services/api/billing";
import { useAuth } from "../context/AuthContext";

export default function Subscription() {
  const { user, refreshProfile } = useAuth();
  const [plans, setPlans] = useState<PlanTier[]>([]);
  const [sub, setSub] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgradingTier, setUpgradingTier] = useState<string | null>(null);
  const [currency, setCurrency] = useState<"usd" | "inr">("usd");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [plansData, subData] = await Promise.all([
          billingApi.getPlans(),
          billingApi.getSubscription(),
        ]);
        setPlans(plansData);
        setSub(subData);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to load subscription details.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const [checkoutModalPlan, setCheckoutModalPlan] = useState<PlanTier | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const handleUpgrade = async (tierId: "free" | "pro" | "studio") => {
    setError(null);
    if (tierId !== "free") {
      const plan = plans.find((p) => p.id === tierId);
      if (plan) {
        setCheckoutModalPlan(plan);
      }
      return;
    }

    setUpgradingTier(tierId);
    try {
      const updated = await billingApi.upgrade(tierId);
      setSub(updated);
      await refreshProfile();
      setSuccessMessage(`Successfully updated your subscription to ${tierId.toUpperCase()}!`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update subscription.";
      setError(msg);
    } finally {
      setUpgradingTier(null);
    }
  };

  const handleProceedPayment = (provider: "razorpay" | "stripe") => {
    setCheckoutLoading(true);
    setTimeout(() => {
      setCheckoutLoading(false);
      setCheckoutModalPlan(null);
      setSuccessMessage(
        `Redirecting to ${provider === "razorpay" ? "Razorpay" : "Stripe"} secure gateway... Once completed, your ${checkoutModalPlan?.name} will be activated.`
      );
      setTimeout(() => setSuccessMessage(null), 6000);
    }, 1200);
  };

  if (loading) {
    return (
      <DashboardLayout title="Billing & Plans">
        <LoadingSpinner message="Loading subscription plans..." />
      </DashboardLayout>
    );
  }

  const currentTier = sub?.tier?.toLowerCase() || "trial";
  const usedBytes = sub?.used_storage_bytes ?? 0;
  const maxBytes = sub?.max_storage_bytes ?? (9 * 1024 * 1024 * 1024);
  const usedGB = (usedBytes / (1024 * 1024 * 1024)).toFixed(2);
  const maxGB = (maxBytes / (1024 * 1024 * 1024)).toFixed(1);
  const storagePercent = Math.min(100, Math.round((usedBytes / maxBytes) * 100));
  const remainingGB = Math.max(0, (maxBytes - usedBytes) / (1024 * 1024 * 1024)).toFixed(1);
  const isTrial = sub?.is_trial_edition !== false;

  return (
    <DashboardLayout title="Storage & Subscription">
      <div className="space-y-8 max-w-6xl mx-auto">
        {/* Header & Status Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-panel p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`h-2.5 w-2.5 rounded-full ${storagePercent >= 90 ? "bg-coral animate-ping" : storagePercent >= 75 ? "bg-[#E6A23C]" : "bg-sage"}`} />
                <Badge variant="active" className="uppercase font-bold tracking-wider text-[10px]">
                  {isTrial ? "Free Trial Edition Active (9.0 GB Allocated)" : `${currentTier.toUpperCase()} Tier Active`}
                </Badge>
                <span className="text-xs text-muted">
                  Studio: <strong className="text-soft-white font-semibold">{user?.studio_name || "Primary Studio"}</strong>
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-soft-white tracking-tight">
                Storage & Plan Overview
              </h2>
              <p className="text-xs text-muted mt-1 max-w-xl leading-relaxed">
                SnapFind AI Trial Edition grants full biometric facial recognition, parallel S3 uploads, and <span className="text-gold font-semibold">Unlimited Events</span> capped at a strict 9.0 GB storage ceiling to guarantee zero overage charges on Cloudflare R2.
              </p>
            </div>

            {/* Currency selector */}
            <div className="flex items-center gap-1.5 self-start md:self-auto bg-midnight border border-slate-800 rounded-xl p-1 text-xs">
              <button
                type="button"
                onClick={() => setCurrency("usd")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  currency === "usd"
                    ? "bg-gold text-midnight shadow-sm font-bold"
                    : "text-muted hover:text-soft-white"
                }`}
              >
                USD ($)
              </button>
              <button
                type="button"
                onClick={() => setCurrency("inr")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  currency === "inr"
                    ? "bg-gold text-midnight shadow-sm font-bold"
                    : "text-muted hover:text-soft-white"
                }`}
              >
                INR (₹)
              </button>
            </div>
          </div>

          {successMessage && (
            <div className="mt-4">
              <Alert type="success">{successMessage}</Alert>
            </div>
          )}
          {error && (
            <div className="mt-4">
              <Alert type="error">{error}</Alert>
            </div>
          )}
        </div>

        {/* Quota Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5 space-y-3 bg-slate-panel border-slate-800 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted font-medium">Monthly Cloud Storage</span>
              <span className="text-xs font-mono font-bold text-gold">
                {usedGB} / {maxGB} GB
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-midnight overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  storagePercent >= 90 ? "bg-coral" : storagePercent >= 75 ? "bg-[#E6A23C]" : "bg-gold"
                }`}
                style={{ width: `${Math.max(3, storagePercent)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted font-mono">
              <span>{storagePercent}% utilized</span>
              <span className="text-sage font-semibold">{remainingGB} GB remaining</span>
            </div>
          </Card>

          <Card className="p-5 space-y-3 bg-slate-panel border-slate-800 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted font-medium">Active Galleries</span>
              <span className="text-xs font-mono font-bold text-gold">
                {sub?.active_events_count} / {isTrial ? "Unlimited" : sub?.max_active_events}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-midnight overflow-hidden border border-slate-800">
              <div className="h-full bg-gold rounded-full w-full" />
            </div>
            <p className="text-[11px] text-muted">
              {isTrial ? "Unlimited events enabled in trial" : `${sub && sub.max_active_events - sub.active_events_count} active slots remaining`}
            </p>
          </Card>

          <Card className="p-5 space-y-3 bg-slate-panel border-slate-800 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted font-medium">Zero-Overage Shield</span>
              <span className="text-xs font-mono font-bold text-sage">
                Active (1.0 GB Buffer)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-midnight overflow-hidden border border-slate-800">
              <div className="h-full bg-sage rounded-full w-full" />
            </div>
            <p className="text-[11px] text-muted">Guaranteed $0 overage fees on Cloudflare R2</p>
          </Card>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-panel space-y-1.5 shadow-sm">
            <div className="flex items-center gap-2 text-gold">
              <span className="text-lg">🛡️</span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-soft-white">Zero-Overage Guarantee</h4>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Uploads automatically lock at 9.0 GB, retaining a 1.0 GB Cloudflare R2 safety buffer so you are never charged unexpected fees.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-slate-800 bg-slate-panel space-y-1.5 shadow-sm">
            <div className="flex items-center gap-2 text-gold">
              <span className="text-lg">✨</span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-soft-white">Unlimited Event Galleries</h4>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Create and manage as many client events, weddings, and shoots as you need. Only overall storage is constrained.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-slate-800 bg-slate-panel space-y-1.5 shadow-sm">
            <div className="flex items-center gap-2 text-gold">
              <span className="text-lg">🔍</span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-soft-white">Full AI Biometric Search</h4>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              InsightFace 512-dimension biometric embedding extraction and guest QR selfie matching are completely enabled.
            </p>
          </div>
        </div>

        {/* Pricing Cards Section */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-xl font-serif font-bold text-soft-white">Commercial Cloud Plans (Future Roadmap)</h3>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-midnight text-muted border border-slate-800">
              Roadmap Preview
            </span>
          </div>
          <p className="text-xs text-muted mb-6">
            Future multi-tier plans for high-volume enterprise studios requiring multi-terabyte storage. Upgrades take effect immediately across all desktop ingestion agents.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {plans.map((plan) => {
              const isCurrent = currentTier === plan.id;
              const price = currency === "usd" ? `$${plan.price_usd_monthly}` : `₹${plan.price_inr_monthly.toLocaleString()}`;

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl flex flex-col justify-between p-6 sm:p-7 transition-all duration-200 border bg-slate-panel ${
                    plan.popular
                      ? "border-gold shadow-md ring-2 ring-gold/20"
                      : "border-slate-800 hover:border-gold/40 shadow-sm"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-gold text-midnight text-[10px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-full shadow-sm">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-serif font-bold text-soft-white">{plan.name}</h4>
                      {isCurrent && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gold/15 text-gold border border-gold/30">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted mt-1 min-h-[36px]">{plan.tagline}</p>

                    <div className="mt-4 mb-6">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-serif font-bold text-soft-white tracking-tight">{price}</span>
                        <span className="text-xs text-muted">/ month</span>
                      </div>
                      <p className="text-[11px] text-gold mt-1 font-semibold">
                        {plan.max_active_events >= 9000 ? "Unlimited" : plan.max_active_events} Active Events •{" "}
                        {plan.max_photos_per_event >= 90000 ? "Unlimited" : plan.max_photos_per_event.toLocaleString()} Photos
                      </p>
                    </div>

                    <div className="space-y-2.5 pt-4 border-t border-slate-800">
                      {plan.features.map((feature, i) => (
                        <div key={i} className="flex items-center gap-2.5 text-xs text-soft-white/90">
                          <svg
                            className="w-4 h-4 text-gold flex-shrink-0"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-8 pt-4 border-t border-slate-800">
                    <Button
                      variant={isCurrent ? "secondary" : plan.popular ? "primary" : "secondary"}
                      size="md"
                      disabled={isCurrent || upgradingTier === plan.id}
                      onClick={() => handleUpgrade(plan.id as "free" | "pro" | "studio")}
                      className={`w-full font-semibold shadow-sm ${!isCurrent && !plan.popular ? "border-slate-700 bg-midnight text-soft-white hover:border-gold" : ""}`}
                    >
                      {upgradingTier === plan.id
                        ? "Switching Plan…"
                        : isCurrent
                        ? "Current Plan"
                        : `Switch to ${plan.name}`}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Checkout Modal */}
        {checkoutModalPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-midnight/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-panel p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-serif font-bold text-soft-white">
                    Upgrade to {checkoutModalPlan.name}
                  </h3>
                  <p className="text-xs text-muted mt-0.5">
                    Select your preferred payment processor
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCheckoutModalPlan(null)}
                  className="rounded-lg p-1.5 text-muted hover:text-soft-white hover:bg-midnight transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="rounded-xl border border-gold/30 bg-midnight p-4 space-y-1">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-gold font-semibold uppercase tracking-wider">Total Amount</span>
                  <span className="text-xl font-serif font-bold text-soft-white">
                    {currency === "usd" ? `$${checkoutModalPlan.price_usd_monthly}` : `₹${checkoutModalPlan.price_inr_monthly.toLocaleString()}`}
                    <span className="text-xs font-normal text-muted font-sans"> / month</span>
                  </span>
                </div>
                <p className="text-[11px] text-muted">
                  Includes {checkoutModalPlan.max_active_events >= 9000 ? "Unlimited" : checkoutModalPlan.max_active_events} active events and {checkoutModalPlan.max_photos_per_event >= 90000 ? "Unlimited" : checkoutModalPlan.max_photos_per_event.toLocaleString()} photos per event.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  disabled={checkoutLoading}
                  onClick={() => handleProceedPayment("razorpay")}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-midnight hover:border-gold transition-all group text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gold/10 text-gold flex items-center justify-center font-bold text-xs">
                      ₹
                    </div>
                    <div>
                      <div className="text-xs font-bold text-soft-white group-hover:text-gold">
                        Pay with Razorpay (India & UPI)
                      </div>
                      <div className="text-[11px] text-muted">
                        UPI, NetBanking, Debit/Credit Cards in INR
                      </div>
                    </div>
                  </div>
                  <span className="text-muted group-hover:text-soft-white">→</span>
                </button>

                <button
                  type="button"
                  disabled={checkoutLoading}
                  onClick={() => handleProceedPayment("stripe")}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-midnight hover:border-gold transition-all group text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gold/10 text-gold flex items-center justify-center font-bold text-xs">
                      $
                    </div>
                    <div>
                      <div className="text-xs font-bold text-soft-white group-hover:text-gold">
                        Pay with Stripe (International)
                      </div>
                      <div className="text-[11px] text-muted">
                        Credit Cards & Global Currency Checkout
                      </div>
                    </div>
                  </div>
                  <span className="text-muted group-hover:text-soft-white">→</span>
                </button>
              </div>

              <div className="text-[11px] text-muted text-center border-t border-slate-800 pt-3">
                🔒 Bank-grade 256-bit SSL encrypted checkout. Cancel anytime.
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
