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
  const [currency] = useState<"usd" | "inr">("usd");

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

  const currentTier = sub?.tier || user?.subscription_tier || "trial";
  const usedBytes = sub?.used_storage_bytes ?? 0;
  const maxBytes = sub?.max_storage_bytes ?? (9 * 1024 * 1024 * 1024);
  const usedGB = (usedBytes / (1024 * 1024 * 1024)).toFixed(2);
  const maxGB = (maxBytes / (1024 * 1024 * 1024)).toFixed(1);
  const storagePercent = Math.min(100, Math.round((usedBytes / maxBytes) * 100));
  const remainingGB = Math.max(0, (maxBytes - usedBytes) / (1024 * 1024 * 1024)).toFixed(1);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Trial Storage Overview Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-panel p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${storagePercent >= 90 ? "bg-[#E87961] animate-ping" : storagePercent >= 75 ? "bg-[#E6A23C]" : "bg-[#8FA382]"}`} />
              <Badge variant="active" className="uppercase font-bold tracking-wider text-[10px]">
                Free Trial Edition Active (9.0 GB Allocated)
              </Badge>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-soft-white tracking-tight">
              Storage & Trial Plan
            </h2>
            <p className="text-xs text-muted max-w-xl leading-relaxed">
              SnapFind AI Trial Edition grants full facial recognition, multi-threaded direct S3 uploads, and <span className="text-gold font-semibold">Unlimited Events</span> capped at a strict 9.0 GB storage ceiling to guarantee zero overage charges on Cloudflare R2.
            </p>
          </div>

          <div className="flex flex-col gap-2 min-w-[260px] bg-midnight p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted font-medium">Monthly Storage Used</span>
              <span className="font-mono text-gold font-bold">{usedGB} / {maxGB} GB</span>
            </div>
            <div className="w-full bg-slate h-2 rounded-full overflow-hidden border border-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  storagePercent >= 90 ? "bg-[#E87961]" : storagePercent >= 75 ? "bg-[#E6A23C]" : "bg-gradient-to-r from-gold to-[#8FA382]"
                }`}
                style={{ width: `${Math.max(2, storagePercent)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-muted font-mono pt-1">
              <span>{storagePercent}% utilized</span>
              <span className="text-[#8FA382] font-semibold">{remainingGB} GB remaining</span>
            </div>
          </div>
        </div>
      </div>

      {/* Trial Feature Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-panel space-y-1.5 shadow-sm">
          <div className="flex items-center gap-2 text-gold">
            <span className="text-lg">🛡️</span>
            <h4 className="text-xs font-bold uppercase tracking-wider text-soft-white">Zero-Overage Guarantee</h4>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            Uploads automatically stop at 9.0 GB, retaining a 1.0 GB Cloudflare R2 safety buffer so you are never billed unexpectedly.
          </p>
        </div>

        <div className="p-5 rounded-xl border border-slate-800 bg-slate-panel space-y-1.5 shadow-sm">
          <div className="flex items-center gap-2 text-gold">
            <span className="text-lg">✨</span>
            <h4 className="text-xs font-bold uppercase tracking-wider text-soft-white">Unlimited Event Galleries</h4>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            Create as many weddings, shoots, and event galleries as you like during your trial. Only total storage is constrained.
          </p>
        </div>

        <div className="p-5 rounded-xl border border-slate-800 bg-slate-panel space-y-1.5 shadow-sm">
          <div className="flex items-center gap-2 text-gold">
            <span className="text-lg">🔍</span>
            <h4 className="text-xs font-bold uppercase tracking-wider text-soft-white">Full AI Face Search</h4>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            InsightFace 512-dimension biometric embedding extraction and guest QR selfie matching are 100% enabled for all events.
          </p>
        </div>
      </div>

      {/* Future SaaS Commercial Plans (Preserved for Future Commercial Expansion) */}
      <div className="pt-4 border-t border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-serif font-bold text-soft-white">Commercial Cloud Plans (Future Roadmap)</h3>
            <p className="text-xs text-muted">Future multi-tier plans for high-volume enterprise studios requiring multi-terabyte storage.</p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate text-muted border border-slate-800">
            Roadmap Preview
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 opacity-90">
          {plans.map((plan) => {
            const isCurrent = plan.id.toLowerCase() === currentTier.toLowerCase();
            return (
              <Card
                key={plan.id}
                className={`p-6 flex flex-col justify-between transition-all duration-200 bg-slate-panel border-slate-800 shadow-sm`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-serif font-bold text-soft-white">{plan.name}</h3>
                    {plan.popular && (
                      <span className="px-2.5 py-0.5 rounded-full bg-gold text-midnight text-[10px] font-bold uppercase tracking-wider">
                        Enterprise
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-muted">{plan.tagline}</p>

                  <div className="pt-2">
                    <span className="text-2xl font-serif font-bold text-soft-white">
                      ${plan.price_usd_monthly}
                    </span>
                    <span className="text-xs text-muted ml-1">/ month</span>
                  </div>

                  <div className="space-y-2 pt-4 border-t border-slate-800 text-xs">
                    <p className="font-semibold text-soft-white">Included Features:</p>
                    <ul className="space-y-1.5 text-muted">
                      <li className="flex items-center gap-2">
                        <span className="text-gold font-bold">✓</span> Up to {plan.max_active_events} active events
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-gold font-bold">✓</span> {plan.max_photos_per_event.toLocaleString()} photos per event
                      </li>
                      {plan.features.map((feat, i) => (
                        <li key={i} className="flex items-center gap-2">
                        <span className="text-gold font-bold">✓</span> {feat}
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
                  className={`w-full font-semibold shadow-sm ${isCurrent ? "border-slate-700 bg-midnight text-soft-white" : ""}`}
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
                  Select payment provider to proceed
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
                <span className="text-xs text-gold font-semibold uppercase tracking-wider">Plan Price</span>
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
              🔒 Opens secure browser checkout session. Once payment is confirmed, your desktop agent updates instantly.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
