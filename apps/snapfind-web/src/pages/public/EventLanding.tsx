import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Alert, Button, Card, LoadingSpinner } from "../../components/common";
import { eventsApi, guestsApi } from "../../services/api";
import type { Guest, Photo, SnapEvent } from "../../types";

export default function EventLanding() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<SnapEvent | null>(null);
  const [publicPhotos, setPublicPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Registered guest state
  const [existingGuest, setExistingGuest] = useState<Guest | null>(null);
  const [isRegisteringNew, setIsRegisteringNew] = useState(false);

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneRaw, setPhoneRaw] = useState("");
  const [email, setEmail] = useState("");

  // Three explicit consents
  const [consentSelfie, setConsentSelfie] = useState(true);
  const [consentWhatsApp, setConsentWhatsApp] = useState(true);
  const [consentMarketing, setConsentMarketing] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadEvent() {
      if (!token) return;
      setLoading(true);
      try {
        const found = await eventsApi.getByToken(token);
        setEvent(found);

        if (found) {
          try {
            const pubRes = await eventsApi.getPublicPhotos(found.public_token || found.token || token);
            setPublicPhotos(pubRes?.items || []);
          } catch {
            setPublicPhotos([]);
          }
        }

        // Check if guest was already registered on this browser
        const stored = localStorage.getItem(`snapfind_guest_${token}`);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setExistingGuest(parsed);
          } catch {
            localStorage.removeItem(`snapfind_guest_${token}`);
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to load event. Please scan the QR code again.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    }
    loadEvent();
  }, [token]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!fullName.trim()) {
      setError("Please provide your full name.");
      return;
    }

    const cleanDigits = phoneRaw.replace(/\D/g, "");
    if (cleanDigits.length < 7) {
      setError("Please enter a valid WhatsApp phone number.");
      return;
    }

    if (!consentSelfie) {
      setError("Selfie processing consent is required to perform facial photo matching.");
      return;
    }

    const fullPhone = `${countryCode}${cleanDigits.startsWith("0") ? cleanDigits.slice(1) : cleanDigits}`;

    setSubmitting(true);
    setError(null);

    try {
      const guest = await guestsApi.register({
        event_token: token,
        full_name: fullName.trim(),
        whatsapp_number: fullPhone,
        email: email.trim() || undefined,
        consent_selfie_processing: consentSelfie,
        consent_whatsapp_transactional: consentWhatsApp,
        consent_marketing: consentMarketing,
        source: "qr_landing",
      });

      localStorage.setItem(`snapfind_guest_${token}`, JSON.stringify(guest));
      setExistingGuest(guest);
      // Proceed directly to selfie search
      navigate(`/event/${token}/search`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed. Please check your phone number and try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F3] flex items-center justify-center p-4">
        <LoadingSpinner message="Opening event..." />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[#FAF8F3] flex flex-col items-center justify-center p-6 text-center text-[#0B1220]">
        <div className="h-16 w-16 rounded-2xl bg-danger/10 border border-danger/20 flex items-center justify-center text-3xl text-danger mb-4 shadow-sm">
          ⚠️
        </div>
        <h1 className="text-xl font-serif font-bold text-[#0B1220]">Event Not Found</h1>
        <p className="text-xs text-[#5A6578] mt-2 max-w-sm">
          The event QR code or link you scanned is invalid or expired. Please contact the event photographer.
        </p>
      </div>
    );
  }

  if (event.isActive === false || event.status?.toLowerCase() === "inactive") {
    return (
      <div className="min-h-screen bg-[#FAF8F3] flex flex-col items-center justify-center p-6 text-center text-[#0B1220]">
        <div className="h-16 w-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-3xl text-amber-600 mb-4 shadow-sm">
          ⏸
        </div>
        <h1 className="text-2xl font-bold font-serif text-[#0B1220]">{event.name}</h1>
        <p className="text-sm font-semibold text-amber-700 mt-2">This event is currently unavailable</p>
        <p className="text-xs text-[#5A6578] mt-2 max-w-sm">
          The event organizer has temporarily deactivated public gallery access. Please check back later.
        </p>
      </div>
    );
  }

  const coverUrl = event.coverImage || event.cover_image_url || event.cover_photo_url || "";
  const welcomeText =
    event.welcome_message ||
    "Scan a selfie to automatically find every photograph of you at this event.";

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#0B1220] flex flex-col font-sans">
      {/* Hero Section */}
      <div className="relative w-full overflow-hidden bg-[#FAF8F3] border-b border-[#E8E2D8]">
        {coverUrl && (
          <div className="absolute inset-0 z-0">
            <img
              src={coverUrl}
              alt={event.name}
              className="h-full w-full object-cover blur-sm opacity-20 scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#FAF8F3]/60 via-[#FAF8F3]/85 to-[#FAF8F3]" />
          </div>
        )}

        <div className="relative z-10 max-w-lg mx-auto px-5 pt-10 pb-8 text-center space-y-3.5">
          {event.custom_logo_url ? (
            <div className="flex justify-center">
              <img
                src={event.custom_logo_url}
                alt="Photographer Logo"
                className="h-12 max-w-[180px] object-contain"
              />
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D6A84F]/15 border border-[#D6A84F]/30 text-[#D6A84F] text-[11px] font-bold tracking-wide uppercase shadow-xs">
              <span>✦</span>
              <span>SnapFind AI • Live Event</span>
            </div>
          )}

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0B1220] tracking-tight leading-snug">
              {event.name}
            </h1>
            <div className="flex items-center justify-center gap-3 text-xs text-[#6B7280] flex-wrap">
              {event.date && (
                <span className="flex items-center gap-1">
                  <span>📅</span> {event.date}
                </span>
              )}
              {event.location && (
                <>
                  <span className="text-[#DCD5C9]">•</span>
                  <span className="flex items-center gap-1">
                    <span>📍</span> {event.location}
                  </span>
                </>
              )}
            </div>
          </div>

          <p className="text-xs sm:text-sm text-[#6B7280] max-w-md mx-auto leading-relaxed">
            {welcomeText}
          </p>

          <div className="flex items-center justify-center gap-2 pt-2">
            <Link
              to={`/event/${token}/gallery`}
              className="inline-flex items-center gap-1 text-xs text-[#D6A84F] hover:underline transition-colors font-semibold"
            >
              <span>
                {publicPhotos.length > 0
                  ? `Browse public gallery (${publicPhotos.length} photos) →`
                  : `Browse full gallery (${event.photoCount || 0} photos) →`}
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 max-w-md mx-auto w-full px-4 py-8 space-y-6">
        {error && <Alert type="error">{error}</Alert>}

        {/* Option A: Returning Guest Welcome Back */}
        {existingGuest && !isRegisteringNew ? (
          <Card className="p-6 bg-white border-[#E8E2D8] space-y-5 shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-full bg-[#D6A84F]/15 border border-[#D6A84F]/30 flex items-center justify-center text-xl text-[#D6A84F] font-bold">
                {existingGuest.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-xs text-[#6B7280]">Welcome back,</p>
                <h3 className="text-lg font-bold text-[#0B1220] leading-tight">
                  {existingGuest.full_name}
                </h3>
                <p className="text-[11px] font-mono text-[#6B7280]">
                  WhatsApp: {existingGuest.whatsapp_number}
                </p>
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate(`/event/${token}/search`)}
                className="w-full text-sm py-3 font-bold rounded-xl shadow-xs flex items-center justify-center gap-2"
              >
                <span>📸 Upload Selfie to Find Your Photos</span>
              </Button>

              <Link to={`/event/${token}/gallery`} className="block w-full">
                <Button variant="secondary" size="md" className="w-full text-xs py-2.5 border-[#E8E2D8]">
                  Browse All Photos
                </Button>
              </Link>
            </div>

            <div className="pt-2 border-t border-[#E8E2D8] text-center">
              <button
                type="button"
                onClick={() => setIsRegisteringNew(true)}
                className="text-xs text-[#6B7280] hover:text-[#0B1220] transition-colors cursor-pointer"
              >
                Not {existingGuest.full_name.split(" ")[0]}? Register as a different guest
              </button>
            </div>
          </Card>
        ) : (
          /* Option B: Guest Registration Form */
          <Card className="p-6 bg-white border-[#E8E2D8] space-y-5 shadow-sm">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-[#0B1220] flex items-center gap-2">
                <span>👤</span> Guest Registration
              </h2>
              <p className="text-xs text-[#6B7280]">
                Register once to find your photos and receive them instantly via WhatsApp.
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#0B1220]">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full rounded-xl border border-[#DCD5C9] bg-[#FAF8F3] px-3.5 py-2.5 text-sm text-[#0B1220] placeholder-[#9CA3AF] outline-none focus:border-[#D6A84F] transition-colors"
                />
              </div>

              {/* WhatsApp Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#0B1220]">
                  WhatsApp Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-24 rounded-xl border border-[#DCD5C9] bg-[#FAF8F3] px-2 py-2.5 text-sm text-[#0B1220] outline-none focus:border-[#D6A84F] font-mono"
                  >
                    <option value="+91">🇮🇳 +91</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+44">🇬🇧 +44</option>
                    <option value="+971">🇦🇪 +971</option>
                    <option value="+61">🇦🇺 +61</option>
                    <option value="+65">🇸🇬 +65</option>
                    <option value="+49">🇩🇪 +49</option>
                  </select>
                  <input
                    type="tel"
                    required
                    value={phoneRaw}
                    onChange={(e) => setPhoneRaw(e.target.value)}
                    placeholder="98765 43210"
                    className="flex-1 rounded-xl border border-[#DCD5C9] bg-[#FAF8F3] px-3.5 py-2.5 text-sm text-[#0B1220] placeholder-[#9CA3AF] outline-none focus:border-[#D6A84F] font-mono transition-colors"
                  />
                </div>
                <p className="text-[11px] text-[#6B7280]">
                  We'll deliver your private gallery link to this WhatsApp number.
                </p>
              </div>

              {/* Email (Optional) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#0B1220]">Email Address</label>
                  <span className="text-[10px] text-[#9CA3AF] uppercase tracking-wide">Optional</span>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-[#DCD5C9] bg-[#FAF8F3] px-3.5 py-2.5 text-sm text-[#0B1220] placeholder-[#9CA3AF] outline-none focus:border-[#D6A84F] transition-colors"
                />
              </div>

              {/* Three Explicit Consents */}
              <div className="space-y-3 pt-2 border-t border-[#E8E2D8]">
                <p className="text-[11px] font-bold text-[#0B1220] uppercase tracking-wider">
                  Consent &amp; Privacy Preferences
                </p>

                {/* Consent 1: Selfie Processing */}
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={consentSelfie}
                    onChange={(e) => setConsentSelfie(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-[#DCD5C9] text-[#D6A84F] focus:ring-[#D6A84F]"
                  />
                  <span className="text-xs text-[#0B1220] leading-snug">
                    <strong className="font-semibold">AI Face Matching Consent (Required)</strong>: I consent to SnapFind AI scanning my selfie solely to locate and group photos containing my face.
                  </span>
                </label>

                {/* Consent 2: WhatsApp Transactional */}
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={consentWhatsApp}
                    onChange={(e) => setConsentWhatsApp(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-[#DCD5C9] text-[#D6A84F] focus:ring-[#D6A84F]"
                  />
                  <span className="text-xs text-[#0B1220] leading-snug">
                    <strong className="font-semibold">WhatsApp Gallery Link</strong>: Text my matched photo link directly to my WhatsApp when processing completes.
                  </span>
                </label>

                {/* Consent 3: Marketing Opt-in */}
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={consentMarketing}
                    onChange={(e) => setConsentMarketing(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-[#DCD5C9] text-[#D6A84F] focus:ring-[#D6A84F]"
                  />
                  <span className="text-xs text-[#6B7280] leading-snug">
                    <span className="text-[#0B1220]">Photographer Updates (Optional)</span>: Keep me updated about future events, offers, and photography highlights.
                  </span>
                </label>
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={submitting}
                  className="w-full text-sm py-3 font-bold rounded-xl shadow-xs"
                >
                  {submitting ? "Registering..." : "Upload Selfie to Find Your Photos →"}
                </Button>
              </div>

              {existingGuest && (
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setIsRegisteringNew(false)}
                    className="text-xs text-[#6B7280] hover:text-[#0B1220] cursor-pointer"
                  >
                    Cancel and return to {existingGuest.full_name}
                  </button>
                </div>
              )}
            </form>
          </Card>
        )}

        {/* Public Gallery Section on Customer Page */}
        {publicPhotos.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm">🌐</span>
                <h3 className="text-sm font-bold text-[#0B1220]">Public Gallery Highlights</h3>
                <span className="rounded-full bg-[#D6A84F]/15 text-[#D6A84F] border border-[#D6A84F]/30 px-2 py-0.5 text-[10px] font-bold">
                  {publicPhotos.length} {publicPhotos.length === 1 ? "Photo" : "Photos"}
                </span>
              </div>
              <Link
                to={`/event/${token}/gallery`}
                className="text-xs font-semibold text-[#D6A84F] hover:underline transition-colors"
              >
                View All →
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {publicPhotos.slice(0, 6).map((photo) => (
                <Link
                  key={photo.id}
                  to={`/event/${token}/gallery`}
                  className="group relative aspect-square rounded-xl overflow-hidden bg-white border border-[#E8E2D8] hover:border-[#D6A84F]/60 transition-all shadow-xs"
                >
                  <img
                    src={photo.thumbnailUrl || photo.url}
                    alt={photo.filename}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                    onError={(e) => {
                      if (photo.url && e.currentTarget.src !== photo.url) {
                        e.currentTarget.src = photo.url;
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-[10px] font-bold text-white bg-black/60 px-1.5 py-0.5 rounded">View</span>
                  </div>
                </Link>
              ))}
            </div>

            <Link to={`/event/${token}/gallery`} className="block">
              <Button variant="secondary" size="sm" className="w-full text-xs py-2 border-[#E8E2D8] flex items-center justify-center gap-2">
                <span>Browse Full Public Gallery ({publicPhotos.length} photos)</span>
                <span>→</span>
              </Button>
            </Link>
          </div>
        )}

        {/* Instructions Card */}
        <div className="p-4 rounded-2xl bg-white border border-[#E8E2D8] space-y-2 text-xs text-[#6B7280] shadow-xs">
          <p className="font-bold text-[#0B1220] flex items-center gap-1.5">
            <span className="text-[#D6A84F]">✦</span> How it works:
          </p>
          <div className="grid grid-cols-3 gap-2 text-center pt-2">
            <div className="p-2.5 rounded-xl bg-[#FAF8F3] space-y-1 border border-[#E8E2D8]">
              <span className="text-lg">1️⃣</span>
              <p className="font-semibold text-[#0B1220] text-[11px]">Register</p>
              <p className="text-[10px] text-[#6B7280] leading-tight">Name &amp; WhatsApp</p>
            </div>
            <div className="p-2.5 rounded-xl bg-[#FAF8F3] space-y-1 border border-[#E8E2D8]">
              <span className="text-lg">2️⃣</span>
              <p className="font-semibold text-[#0B1220] text-[11px]">Upload Selfie</p>
              <p className="text-[10px] text-[#6B7280] leading-tight">Camera or gallery</p>
            </div>
            <div className="p-2.5 rounded-xl bg-[#FAF8F3] space-y-1 border border-[#E8E2D8]">
              <span className="text-lg">3️⃣</span>
              <p className="font-semibold text-[#0B1220] text-[11px]">Get Photos</p>
              <p className="text-[10px] text-[#6B7280] leading-tight">Instant gallery</p>
            </div>
          </div>
        </div>

        {/* Footer Branding */}
        {event.show_snapfind_branding !== false && (
          <div className="text-center pt-4 pb-8 space-y-1">
            <p className="text-[11px] text-[#6B7280] font-mono">
              Powered by <strong className="text-[#D6A84F]">SnapFind AI</strong>
            </p>
            <p className="text-[10px] text-[#9CA3AF]">Capture. Organize. Find. Share.</p>
          </div>
        )}
      </div>
    </div>
  );
}

