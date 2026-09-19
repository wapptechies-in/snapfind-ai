import { useState, type FormEvent, type ReactNode } from "react";
import { submitBookingEnquiry, type BookingEnquiry } from "../../services/bookingService";

const eventTypes = [
  "Wedding",
  "Marriage",
  "Birthday",
  "Sports",
  "Events",
  "Candid",
  "Family",
  "Corporate",
  "Nature",
  "Other",
];

type FormState = BookingEnquiry;
type FormErrors = Partial<Record<keyof FormState, string>>;

const initialState: FormState = {
  name: "",
  phone: "",
  email: "",
  eventType: eventTypes[0],
  eventDate: "",
  location: "",
  guestCount: "",
  message: "",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+]?[\d\s().-]{7,20}$/;

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};

  if (!form.name.trim()) errors.name = "Name is required.";

  if (!form.phone.trim()) {
    errors.phone = "Phone number is required.";
  } else if (!PHONE_RE.test(form.phone)) {
    errors.phone = "Enter a valid phone number.";
  }

  if (!form.email.trim()) {
    errors.email = "Email is required.";
  } else if (!EMAIL_RE.test(form.email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!form.eventDate) {
    errors.eventDate = "Event date is required.";
  } else if (new Date(form.eventDate) < new Date(new Date().toDateString())) {
    errors.eventDate = "Event date can't be in the past.";
  }

  if (!form.location.trim()) errors.location = "Location is required.";

  if (!form.message.trim()) {
    errors.message = "Tell us a little about the event.";
  } else if (form.message.trim().length < 20) {
    errors.message = "Please add at least 20 characters so we understand the brief.";
  }

  return errors;
}

export default function BookingForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setStatus("idle");
      return;
    }

    setStatus("submitting");
    try {
      await submitBookingEnquiry(form);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center rounded-xl border border-hairline bg-panel px-8 py-16 text-center">
        <p className="font-display text-2xl text-ivory">Enquiry received.</p>
        <p className="mt-3 max-w-sm text-sm text-muted">
          Thanks, {form.name.split(" ")[0]} — we'll follow up at {form.email} within one
          business day. (This is a mock confirmation — Phase 2 does not
          send this to a real inbox or database yet.)
        </p>
        <button
          onClick={() => {
            setForm(initialState);
            setStatus("idle");
          }}
          className="mt-8 rounded-full border border-hairline px-6 py-3 text-sm text-ivory hover:border-brass"
        >
          Send another enquiry
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5 rounded-xl border border-hairline bg-panel p-8">
      {status === "error" && (
        <div role="alert" className="rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          Something went wrong sending your enquiry. Please try again.
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name" htmlFor="name" error={errors.name}>
          <input
            id="name"
            type="text"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            aria-invalid={!!errors.name}
            className={inputClass(!!errors.name)}
          />
        </Field>

        <Field label="Phone" htmlFor="phone" error={errors.phone}>
          <input
            id="phone"
            type="tel"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            aria-invalid={!!errors.phone}
            placeholder="+1 555 010 0100"
            className={inputClass(!!errors.phone)}
          />
        </Field>
      </div>

      <Field label="Email" htmlFor="email" error={errors.email}>
        <input
          id="email"
          type="email"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          aria-invalid={!!errors.email}
          className={inputClass(!!errors.email)}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Event type" htmlFor="eventType">
          <select
            id="eventType"
            value={form.eventType}
            onChange={(e) => update("eventType", e.target.value)}
            className={inputClass(false)}
          >
            {eventTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Event date" htmlFor="eventDate" error={errors.eventDate}>
          <input
            id="eventDate"
            type="date"
            value={form.eventDate}
            onChange={(e) => update("eventDate", e.target.value)}
            aria-invalid={!!errors.eventDate}
            className={inputClass(!!errors.eventDate)}
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Location" htmlFor="location" error={errors.location}>
          <input
            id="location"
            type="text"
            value={form.location}
            onChange={(e) => update("location", e.target.value)}
            aria-invalid={!!errors.location}
            placeholder="City or venue"
            className={inputClass(!!errors.location)}
          />
        </Field>

        <Field label="Approximate guest count" htmlFor="guestCount">
          <input
            id="guestCount"
            type="number"
            min={0}
            value={form.guestCount}
            onChange={(e) => update("guestCount", e.target.value)}
            className={inputClass(false)}
          />
        </Field>
      </div>

      <Field label="Message" htmlFor="message" error={errors.message}>
        <textarea
          id="message"
          rows={5}
          value={form.message}
          onChange={(e) => update("message", e.target.value)}
          aria-invalid={!!errors.message}
          placeholder="Tell us about the day, timeline, and vision..."
          className={`${inputClass(!!errors.message)} resize-none`}
        />
      </Field>

      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full rounded-full bg-brass px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-brass-light disabled:opacity-60"
      >
        {status === "submitting" ? "Sending…" : "Send Enquiry"}
      </button>
      <p className="text-center text-[11px] text-muted">
        MOCK submission — not yet connected to the backend.
      </p>
    </form>
  );
}

function inputClass(hasError: boolean) {
  return `mt-1.5 w-full rounded-md border bg-ink px-4 py-3 text-sm text-ivory outline-none focus:border-brass ${
    hasError ? "border-red-500/60" : "border-hairline"
  }`;
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs text-muted" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {error && (
        <p className="mt-1.5 text-xs text-red-300" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
