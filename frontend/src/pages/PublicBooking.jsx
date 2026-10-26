import { ArrowLeft, ArrowRight, BadgeCheck, CalendarDays, CalendarPlus, Check, CheckCircle2, Clock3, LoaderCircle, Mail, MapPin, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import client from "../api/client";
import CustomerAvatar from "../components/CustomerAvatar";
import ServiceIcon from "../components/ServiceIcon";
import logo from "../assets/logo.png";

const today = () => {
  const current = new Date();
  return `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`;
};
const formatPrice = (value) => Number(value) > 0 ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value)) : "Free";
const displayDate = (value) => value ? new Intl.DateTimeFormat("en-IN", { dateStyle: "full" }).format(new Date(`${value}T00:00:00`)) : "";
const displayTime = (value) => value ? new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" }).format(new Date(`1970-01-01T${value}:00`)) : "";

export default function PublicBooking({ result }) {
  const [searchParams] = useSearchParams();
  if (result) return <BookingResult result={result} searchParams={searchParams} />;
  return <BookingForm />;
}

function BookingForm() {
  const slug = window.location.pathname.slice(1).split("/")[0];
  const [business, setBusiness] = useState(null);
  const [services, setServices] = useState([]);
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState(today());
  const [slots, setSlots] = useState([]);
  const [slot, setSlot] = useState(null);
  const [customer, setCustomer] = useState({ customerName: "", customerEmail: "", notes: "", emailOtp: "" });
  const [otpSent, setOtpSent] = useState(false);
  const [loadingPage, setLoadingPage] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const activeService = services.find((service) => service._id === serviceId);
  useEffect(() => {
    client.get(`/public/${encodeURIComponent(slug)}`)
      .then(({ data }) => { setBusiness(data.business); setServices(data.services || []); })
      .catch((requestError) => setError(requestError.response?.data?.message || requestError.response?.data?.error || "This booking page couldn’t be found."))
      .finally(() => setLoadingPage(false));
  }, [slug]);

  useEffect(() => {
    if (!serviceId || !date) return;
    const controller = new AbortController();
    void Promise.resolve().then(async () => {
      setLoadingSlots(true);
      setError("");
      try {
        const { data } = await client.get(`/public/${encodeURIComponent(slug)}/slots`, {
          params: { date, serviceId },
          signal: controller.signal,
        });
        setSlots(data.slots || []);
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setSlots([]);
          setError(requestError.response?.data?.message || requestError.response?.data?.error || "We couldn’t load available times.");
        }
      } finally {
        if (!controller.signal.aborted) setLoadingSlots(false);
      }
    });
    return () => controller.abort();
  }, [date, serviceId, slug]);

  const requestOtp = async () => {
    setError(""); setNotice(""); setSendingOtp(true);
    try {
      const { data } = await client.post(`/public/${encodeURIComponent(slug)}/request-otp`, { customerEmail: customer.customerEmail });
      setOtpSent(true);
      setNotice(data.message || "Check your email for a verification code.");
    } catch (requestError) { setError(requestError.response?.data?.message || "We couldn’t send your verification code."); }
    finally { setSendingOtp(false); }
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!slot) { setError("Choose an available time before continuing."); return; }
    setSubmitting(true); setError(""); setNotice("");
    try {
      await client.post(`/public/${encodeURIComponent(slug)}/verify-otp`, { customerEmail: customer.customerEmail, emailOtp: customer.emailOtp });
      const { data } = await client.post(`/public/${encodeURIComponent(slug)}/book`, {
        ...customer,
        serviceId,
        date,
        startTime: slot.startTime,
        endTime: slot.endTime,
      });
      if (data.checkoutUrl) {
        window.location.assign(data.checkoutUrl);
        return;
      }
      const query = new URLSearchParams({ booking_id: data.booking?._id || "", slug });
      window.location.assign(`/booking/success?${query.toString()}`);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "We couldn’t complete the booking. Please try again.");
    } finally { setSubmitting(false); }
  };

  const accent = business?.brandAccent || "#047857";
  const serviceDuration = useMemo(() => activeService?.duration ? `${activeService.duration} minutes` : "", [activeService]);

  if (loadingPage) return <div className="public-loading"><LoaderCircle className="spin" /> Loading booking page…</div>;
  if (!business) return <div className="public-not-found"><span className="auth-brand-mark"><img src={logo} alt="" /></span><p className="eyebrow">BOOKHOP</p><h1>We couldn’t find this page.</h1><p>{error || "Check that the link is correct and try again."}</p><Link className="button-secondary" to="/login">Go to BookHop <ArrowRight size={16} /></Link></div>;

  return <div className="public-booking-screen" style={{ "--brand-accent": accent }}>
    <header className="public-header"><Link className="public-logo" to="/"><img src={logo} alt="" />BookHop</Link><span><ShieldCheck size={15} /> Secure booking</span></header>
    <div className="public-booking-layout">
      <section className="public-intro">
        <span className="public-eyebrow"><span /> BOOK AN APPOINTMENT</span>
        <h1>A little time<br />just for <em>{business.businessName || business.buisnessName || business.name}.</em></h1>
        <p>{business.businessDescription || business.buisnessDescription || "Choose a service and a time that works for you. We’ll take care of the rest."}</p>
        <div className="public-business-badge"><span style={{ background: accent }}>{(business.businessName || business.name || "B").slice(0, 1).toUpperCase()}</span><div><strong>{business.businessName || business.buisnessName || business.name}</strong><small><MapPin size={13} /> Book online, at your convenience</small></div><BadgeCheck size={18} /></div>
        <div className="public-trust"><span><CheckCircle2 size={15} /> Easy scheduling</span><span><ShieldCheck size={15} /> Verified email</span></div>
      </section>
      <section className="public-form-card">
        <div className="public-form-header"><span className="public-step-mark"><CalendarDays size={19} /></span><div><span className="eyebrow">LET'S GET YOU BOOKED</span><h2>Choose a time</h2></div></div>
        {error && <div className="form-alert error" role="alert">{error}</div>}
        {notice && <div className="form-alert success" role="status">{notice}</div>}
        {services.length === 0 ? <div className="empty-state compact-empty"><h2>Bookings are not open just yet.</h2><p>This business hasn’t added any services yet. Please check back later.</p></div> : <form onSubmit={submit}>
          <label className="field-label">Choose a service
            <select value={serviceId} onChange={(event) => { setServiceId(event.target.value); setSlot(null); setSlots([]); }} required>
              <option value="">Select an offering</option>
              {services.map((service) => <option key={service._id} value={service._id}>{service.name} · {service.duration} min · {formatPrice(service.price)}</option>)}
            </select>
          </label>
          {activeService && <div className="selected-service"><span className="selected-service-icon"><ServiceIcon name={activeService.icon} className="service-icon-image" /></span><span><strong>{activeService.name}</strong><small>{activeService.description || serviceDuration}</small></span><strong>{formatPrice(activeService.price)}</strong></div>}
          <label className="field-label">Pick a date<input type="date" min={today()} value={date} onChange={(event) => { setDate(event.target.value); setSlot(null); setSlots([]); }} required /></label>
          <div className="field-label">Available times {date && <span className="date-caption">{displayDate(date)}</span>}</div>
          {loadingSlots ? <div className="slots-loading"><LoaderCircle className="spin" /> Finding a time…</div> : !serviceId ? <div className="slots-empty">Choose a service to see available times.</div> : slots.length === 0 ? <div className="slots-empty">No times available on this date. Try another day.</div> :
            <div className="slot-grid">{slots.map((item) => <button type="button" key={item.startTime} className={`slot-button${slot?.startTime === item.startTime ? " selected" : ""}`} onClick={() => setSlot(item)}>{displayTime(item.startTime)}</button>)}</div>}
          <div className="form-divider"><span>YOUR DETAILS</span></div>
          <label className="field-label">Your name<span className="input-wrap"><UserRound size={16} /><input autoComplete="name" value={customer.customerName} onChange={(event) => setCustomer({ ...customer, customerName: event.target.value })} placeholder="Name for the booking" required /></span></label>
          <label className="field-label">Email address<span className="input-wrap"><Mail size={16} /><input type="email" autoComplete="email" value={customer.customerEmail} onChange={(event) => { setCustomer({ ...customer, customerEmail: event.target.value, emailOtp: "" }); setOtpSent(false); }} placeholder="you@example.com" required /></span></label>
          {!otpSent ? <button className="button-secondary button-full verify-button" type="button" onClick={requestOtp} disabled={sendingOtp || !customer.customerEmail}>{sendingOtp ? "Sending verification code…" : "Email me a verification code"} <ArrowRight size={15} /></button> :
            <>
              <label className="field-label">Verification code<input inputMode="numeric" autoComplete="one-time-code" value={customer.emailOtp} onChange={(event) => setCustomer({ ...customer, emailOtp: event.target.value })} placeholder="Enter the code from your email" required /></label>
              <button className="otp-resend public-otp-resend" type="button" onClick={requestOtp} disabled={sendingOtp}>{sendingOtp ? "Sending…" : "Resend code"}</button>
            </>}
          <label className="field-label">Anything we should know? <span className="optional">Optional</span><textarea rows="2" value={customer.notes} onChange={(event) => setCustomer({ ...customer, notes: event.target.value })} placeholder="Add a note for the business" /></label>
          <button className="button-primary button-full public-submit" disabled={submitting || !slot || !otpSent}>{submitting ? "Confirming your booking…" : Number(activeService?.price) > 0 ? `Continue to payment · ${formatPrice(activeService.price)}` : "Confirm booking"} {submitting ? <LoaderCircle className="spin" size={17} /> : <ArrowRight size={17} />}</button>
          <p className="public-form-footnote"><LockKeyholeIcon /> Your details are only shared with this business for your appointment.</p>
        </form>}
      </section>
    </div>
    <footer className="public-footer"><span>Made for more meaningful moments.</span><span>Powered by <strong>BookHop</strong></span></footer>
  </div>;
}

function LockKeyholeIcon() {
  return <ShieldCheck size={14} aria-hidden="true" />;
}

function BookingResult({ result, searchParams }) {
  const success = result === "success";
  const sessionId = searchParams.get("session_id");
  const bookingId = searchParams.get("booking_id");
  const slug = searchParams.get("slug");
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState("");
  const [cancelMessage, setCancelMessage] = useState("");
  const [loading, setLoading] = useState(success && Boolean(sessionId || bookingId));
  useEffect(() => {
    if (!success || (!sessionId && !bookingId)) return;
    const params = sessionId ? { session_id: sessionId } : { booking_id: bookingId };
    client.get("/public/booking/status", { params })
      .then(({ data }) => setBooking(data.booking))
      .catch((requestError) => setError(requestError.response?.data?.message || "Your booking is still being confirmed. Refresh this page in a moment."))
      .finally(() => setLoading(false));
  }, [success, sessionId, bookingId]);
  useEffect(() => {
    if (success || !bookingId) return;
    client.get("/public/booking/cancel-payment", { params: { booking_id: bookingId } })
      .then(({ data }) => setCancelMessage(data.message || "Payment was not completed."))
      .catch((requestError) => setError(requestError.response?.data?.message || "We couldn’t update the pending booking. Please contact the business if you need help."));
  }, [bookingId, success]);

  if (!success) return <div className="result-screen cancelled"><div className="result-card"><span className="result-icon"><ArrowLeft size={25} /></span><p className="eyebrow">PAYMENT NOT COMPLETED</p><h1>Your booking isn’t confirmed.</h1><p>{error || cancelMessage || "You can return to the booking page and choose another time or try the payment again."}</p>{slug && <Link to={`/${slug}`} className="button-primary">Return to booking page <ArrowRight size={16} /></Link>}</div></div>;
  return <div className="result-screen"><div className="result-card"><span className="result-icon"><Check size={25} /></span><p className="eyebrow">ALL SET</p><h1>{loading ? "Confirming your booking…" : booking ? "You’re on the calendar." : "Thanks for booking."}</h1>
    {loading ? <div className="slots-loading"><LoaderCircle className="spin" /> Checking your booking…</div> : <><p>{error || "Your appointment details have been sent to your email."}</p>{booking && <><div className="result-customer"><CustomerAvatar name={booking.customerName} identity={booking.customerEmail || booking.customerName} /><strong>{booking.customerName}</strong></div><div className="result-details"><span><CalendarDays size={16} /> {displayDate(booking.date)}</span><span><Clock3 size={16} /> {displayTime(booking.startTime)} – {displayTime(booking.endTime)}</span><span><Sparkles size={16} /> {booking.serviceId?.name || "Appointment"}</span></div></>}{booking?.customerCalendarUrl && <a href={booking.customerCalendarUrl} target="_blank" rel="noreferrer" className="button-secondary"><CalendarPlus size={16} /> Add to calendar</a>}</>}
    {slug && <Link className="result-back-link" to={`/${slug}`}>Back to the booking page</Link>}</div></div>;
}
