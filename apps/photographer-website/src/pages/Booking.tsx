import SEO from "../components/common/SEO";
import BookingForm from "../components/booking/BookingForm";

export default function Booking() {
  return (
    <div className="container-page py-20 md:py-28">
      <SEO
        title="Booking"
        description="Send a booking enquiry — tell us your event type, date, and location."
      />

      <div className="mx-auto max-w-xl">
        <p className="text-center text-sm tracking-wide text-brass-light">Booking</p>
        <h1 className="mt-4 text-center font-display text-4xl leading-tight text-ivory md:text-5xl">
          Let's find a date.
        </h1>
        <p className="mt-6 text-center text-sm leading-relaxed text-muted">
          Fill this out and we'll follow up within a business day to
          confirm availability and details.
        </p>

        <div className="mt-12">
          <BookingForm />
        </div>
      </div>
    </div>
  );
}
