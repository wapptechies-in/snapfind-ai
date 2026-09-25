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

  const currentTier = sub?.tier?.toLowerCase() || "pro";
  const eventsPercent = sub ? Math.min(100, Math.round((sub.active_events_count / sub.max_active_events) * 100)) : 0;

  return (
    <DashboardLayout title="Billing & Plans">
      <div className="space-y-8 max-w-6xl mx-auto">
        {/* Header & Status Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-warm-beige bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="h-2 w-2 rounded-full bg-forest animate-pulse" />
                <Badge variant="active" className="uppercase font-bold tracking-wider">
                  {currentTier} Tier Active
                </Badge>
                <span className="text-xs text-warm-gray">
                  Studio: <strong className="text-charcoal font-semibold">{user?.studio_name}</strong>
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal tracking-tight">
                Subscription & Resource Quotas
              </h2>
              <p className="text-xs text-warm-gray mt-1 max-w-xl">
                Manage your cloud gallery limits, parallel upload pipelines, and guest print paywalls.
                Keep 100% of guest download profits.
              </p>
            </div>

            {/* Currency selector */}
            <div className="flex items-center gap-1.5 self-start md:self-auto bg-sand-light border border-warm-beige rounded-xl p-1 text-xs">
              <button
                type="button"
                onClick={() => setCurrency("usd")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  currency === "usd"
                    ? "bg-forest text-cream shadow-sm"
                    : "text-warm-gray hover:text-charcoal"
                }`}
              >
                USD ($)
              </button>
              <button
                type="button"
                onClick={() => setCurrency("inr")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  currency === "inr"
                    ? "bg-forest text-cream shadow-sm"
                    : "text-warm-gray hover:text-charcoal"
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
          <Card className="p-5 space-y-3 bg-white border-warm-beige shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-warm-gray font-medium">Active Galleries</span>
              <span className="text-xs font-mono font-bold text-forest">
                {sub?.active_events_count} / {sub?.max_active_events}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-sand-light overflow-hidden border border-warm-beige">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  eventsPercent > 80 ? "bg-amber-500" : "bg-forest"
                }`}
                style={{ width: `${Math.max(5, eventsPercent)}%` }}
              />
            </div>
            <p className="text-[11px] text-warm-gray">
              {sub && sub.max_active_events - sub.active_events_count} remaining active slots
            </p>
          </Card>

          <Card className="p-5 space-y-3 bg-white border-warm-beige shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-warm-gray font-medium">Photos per Gallery</span>
              <span className="text-xs font-mono font-bold text-forest">
                {sub?.max_photos_per_event.toLocaleString()} max
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-sand-light overflow-hidden border border-warm-beige">
              <div className="h-full bg-forest-light rounded-full w-full" />
            </div>
            <p className="text-[11px] text-warm-gray">Concurrent S3/MinIO chunked streaming</p>
          </Card>

          <Card className="p-5 space-y-3 bg-white border-warm-beige shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-warm-gray font-medium">Total Stored Photos</span>
              <span className="text-xs font-mono font-bold text-forest">
                {sub?.total_photos_count.toLocaleString()}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-sand-light overflow-hidden border border-warm-beige">
              <div className="h-full bg-sage rounded-full w-3/4" />
            </div>
            <p className="text-[11px] text-warm-gray">Indexed in pgvector AI embeddings</p>
          </Card>
        </div>

        {/* Pricing Cards Section */}
        <div>
          <h3 className="text-xl font-serif font-bold text-charcoal mb-1">Available Studio Tiers</h3>
          <p className="text-xs text-warm-gray mb-6">
            Scale up or down anytime. Upgrades take effect immediately across all desktop ingestion agents.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {plans.map((plan) => {
              const isCurrent = currentTier === plan.id;
              const price = currency === "usd" ? `$${plan.price_usd_monthly}` : `₹${plan.price_inr_monthly.toLocaleString()}`;

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl flex flex-col justify-between p-6 sm:p-7 transition-all duration-200 border ${
                    plan.popular
                      ? "border-forest bg-white shadow-md ring-2 ring-forest/20"
                      : "border-warm-beige bg-white hover:border-forest/40 shadow-sm"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-forest text-cream text-[10px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-full shadow-sm">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-serif font-bold text-charcoal">{plan.name}</h4>
                      {isCurrent && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-forest/10 text-forest border border-forest/20">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-warm-gray mt-1 min-h-[36px]">{plan.tagline}</p>

                    <div className="mt-4 mb-6">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-serif font-bold text-charcoal tracking-tight">{price}</span>
                        <span className="text-xs text-warm-gray">/ month</span>
                      </div>
                      <p className="text-[11px] text-forest mt-1 font-semibold">
                        {plan.max_active_events >= 9000 ? "Unlimited" : plan.max_active_events} Active Events •{" "}
                        {plan.max_photos_per_event >= 90000 ? "Unlimited" : plan.max_photos_per_event.toLocaleString()} Photos
                      </p>
                    </div>

                    <div className="space-y-2.5 pt-4 border-t border-warm-beige">
                      {plan.features.map((feature, i) => (
                        <div key={i} className="flex items-center gap-2.5 text-xs text-charcoal/90">
                          <svg
                            className="w-4 h-4 text-forest flex-shrink-0"
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

                  <div className="mt-8 pt-4 border-t border-warm-beige">
                    <Button
                      variant={isCurrent ? "secondary" : plan.popular ? "primary" : "secondary"}
                      size="md"
                      disabled={isCurrent || upgradingTier === plan.id}
                      onClick={() => handleUpgrade(plan.id as "free" | "pro" | "studio")}
                      className={`w-full font-semibold shadow-sm ${!isCurrent && !plan.popular ? "border-warm-beige" : ""}`}
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl border border-warm-beige bg-white p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-warm-beige pb-4">
                <div>
                  <h3 className="text-lg font-serif font-bold text-charcoal">
                    Upgrade to {checkoutModalPlan.name}
                  </h3>
                  <p className="text-xs text-warm-gray mt-0.5">
                    Select your preferred payment processor
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCheckoutModalPlan(null)}
                  className="rounded-lg p-1.5 text-warm-gray hover:text-charcoal hover:bg-sand-light transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="rounded-xl border border-forest/20 bg-sand-light p-4 space-y-1">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-forest font-semibold uppercase tracking-wider">Total Amount</span>
                  <span className="text-xl font-serif font-bold text-charcoal">
                    {currency === "usd" ? `$${checkoutModalPlan.price_usd_monthly}` : `₹${checkoutModalPlan.price_inr_monthly.toLocaleString()}`}
                    <span className="text-xs font-normal text-warm-gray font-sans"> / month</span>
                  </span>
                </div>
                <p className="text-[11px] text-warm-gray">
                  Includes {checkoutModalPlan.max_active_events >= 9000 ? "Unlimited" : checkoutModalPlan.max_active_events} active events and {checkoutModalPlan.max_photos_per_event >= 90000 ? "Unlimited" : checkoutModalPlan.max_photos_per_event.toLocaleString()} photos per event.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  disabled={checkoutLoading}
                  onClick={() => handleProceedPayment("razorpay")}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl border border-warm-beige bg-sand-light/50 hover:border-forest hover:bg-sand-light transition-all group text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-forest/10 text-forest flex items-center justify-center font-bold text-xs">
                      ₹
                    </div>
                    <div>
                      <div className="text-xs font-bold text-charcoal group-hover:text-forest">
                        Pay with Razorpay (India & UPI)
                      </div>
                      <div className="text-[11px] text-warm-gray">
                        UPI, NetBanking, Debit/Credit Cards in INR
                      </div>
                    </div>
                  </div>
                  <span className="text-warm-gray group-hover:text-charcoal">→</span>
                </button>

                <button
                  type="button"
                  disabled={checkoutLoading}
                  onClick={() => handleProceedPayment("stripe")}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl border border-warm-beige bg-sand-light/50 hover:border-forest hover:bg-sand-light transition-all group text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-champagne/20 text-charcoal flex items-center justify-center font-bold text-xs">
                      $
                    </div>
                    <div>
                      <div className="text-xs font-bold text-charcoal group-hover:text-forest">
                        Pay with Stripe (International)
                      </div>
                      <div className="text-[11px] text-warm-gray">
                        Credit Cards & Global Currency Checkout
                      </div>
                    </div>
                  </div>
                  <span className="text-warm-gray group-hover:text-charcoal">→</span>
                </button>
              </div>

              <div className="text-[11px] text-warm-gray text-center border-t border-warm-beige pt-3">
                🔒 Bank-grade 256-bit SSL encrypted checkout. Cancel anytime.
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

