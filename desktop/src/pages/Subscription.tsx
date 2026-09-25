import React, { useEffect, useState } from "react";
import { Badge, Button, Card, LoadingSpinner } from "../components/common";
import { billingApi } from "../api";
import { useApp } from "../state/store";
import type { PlanTier, SubscriptionStatus } from "../types";

export const Subscription: React.FC = () => {
  const { user } = useApp();
  const [plans, setPlans] = useState<PlanTier[]>([]);
  const [sub, setSub] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgradingTier, setUpgradingTier] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [plansData, subData] = await Promise.all([
        billingApi.getPlans().catch(() => []),
        billingApi.getSubscription().catch(() => null),
      ]);
      setPlans(plansData);
      setSub(subData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const [checkoutModalPlan, setCheckoutModalPlan] = useState<PlanTier | null>(null);
  const [currency, setCurrency] = useState<"usd" | "inr">("usd");

  const handleUpgrade = async (tierId: string) => {
    if (tierId !== "free") {
      const plan = plans.find((p) => p.id === tierId);
      if (plan) {
        setCheckoutModalPlan(plan);
      }
      return;
    }

    try {
      setUpgradingTier(tierId);
      const updated = await billingApi.upgrade(tierId);
      setSub(updated);
      alert(`Subscription plan updated to ${tierId.toUpperCase()}!`);
    } catch (err) {
      alert(`Downgrade failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setUpgradingTier(null);
    }
  };

  const handleProceedPayment = (provider: "razorpay" | "stripe") => {
    const webBillingUrl = "http://localhost:5173/subscription";
    if (window.desktopAPI) {
      window.desktopAPI.openExternal(webBillingUrl);
    } else {
      window.open(webBillingUrl, "_blank");
    }
    setCheckoutModalPlan(null);
    alert(
      `Opening secure ${provider === "razorpay" ? "Razorpay" : "Stripe"} billing portal in your browser. Complete your checkout there to activate ${checkoutModalPlan?.name}.`
    );
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner message="Loading studio subscription details..." />
      </div>
    );
  }

  const currentTier = sub?.tier || user?.subscription_tier || "free";

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Current Plan Overview Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-warm-beige bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="h-2 w-2 rounded-full bg-forest animate-pulse" />
              <Badge variant="active" className="uppercase font-bold tracking-wider">
                {currentTier} Tier Active
              </Badge>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal tracking-tight">Studio Subscription</h2>
            <p className="text-xs text-warm-gray mt-1 max-w-xl">
              High-resolution photo processing, multi-core concurrent uploads, facial recognition indexing, and customer gallery limits.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-sand-light p-4 rounded-xl border border-warm-beige">
            <div>
              <p className="text-[10px] text-warm-gray uppercase font-semibold">Active Galleries</p>
              <p className="text-xl font-bold font-mono text-charcoal">
                {sub?.active_events_count ?? 1} / {sub?.max_active_events ?? 5}
              </p>
            </div>
            <div className="h-8 w-px bg-warm-beige" />
            <div>
              <p className="text-[10px] text-warm-gray uppercase font-semibold">Max Photos / Album</p>
              <p className="text-xl font-bold font-mono text-charcoal">
                {(sub?.max_photos_per_event ?? 1000).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Plan Tiers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {plans.map((plan) => {
          const isCurrent = plan.id.toLowerCase() === currentTier.toLowerCase();
          return (
            <Card
              key={plan.id}
              className={`p-6 flex flex-col justify-between transition-all duration-200 bg-white ${
                isCurrent
                  ? "border-forest ring-2 ring-forest/30 shadow-md"
                  : "border-warm-beige hover:border-forest/40 shadow-sm"
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-serif font-bold text-charcoal">{plan.name}</h3>
                  {plan.popular && (
                    <span className="px-2.5 py-0.5 rounded-full bg-forest/10 text-forest text-[10px] font-bold uppercase tracking-wider border border-forest/20">
                      Popular
                    </span>
                  )}
                  {isCurrent && (
                    <Badge variant="active">Current Plan</Badge>
                  )}
                </div>

                <p className="text-xs text-warm-gray">{plan.tagline}</p>

                <div className="pt-2">
                  <span className="text-3xl font-serif font-bold text-charcoal">
                    ${plan.price_usd_monthly}
                  </span>
                  <span className="text-xs text-warm-gray ml-1">/ month</span>
                </div>

                <div className="space-y-2 pt-4 border-t border-warm-beige text-xs">
                  <p className="font-semibold text-charcoal">Included Features:</p>
                  <ul className="space-y-1.5 text-warm-gray">
                    <li className="flex items-center gap-2">
                      <span className="text-forest font-bold">✓</span> Up to {plan.max_active_events} active events
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-forest font-bold">✓</span> {plan.max_photos_per_event.toLocaleString()} photos per event
                    </li>
                    {plan.features.map((feat, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="text-forest font-bold">✓</span> {feat}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-6">
                <Button
                  size="md"
                  variant={isCurrent ? "secondary" : "primary"}
                  disabled={isCurrent || upgradingTier === plan.id}
                  onClick={() => handleUpgrade(plan.id)}
                  className={`w-full font-semibold shadow-sm ${isCurrent ? "border-warm-beige" : ""}`}
                >
                  {isCurrent
                    ? "Active Plan"
                    : upgradingTier === plan.id
                    ? "Upgrading..."
                    : `Upgrade to ${plan.name}`}
                </Button>
              </div>
            </Card>
          );
        })}
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
                  Select payment provider to proceed
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
                <span className="text-xs text-forest font-semibold uppercase tracking-wider">Plan Price</span>
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
              🔒 Opens secure browser checkout session. Once payment is confirmed, your desktop agent updates instantly.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

