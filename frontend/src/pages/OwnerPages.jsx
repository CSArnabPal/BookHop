import {
  ArrowDownLeft, ArrowRight, ArrowUpRight, BadgeCheck, Banknote, CalendarCheck2,
  CalendarClock, CalendarDays, Check, CheckCircle2, ChevronRight, CircleHelp,
  Clock3, Copy, ExternalLink, LoaderCircle, Plus, Save, ShieldCheck,
  Sparkles, Trash2, Wallet, X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client";
import CustomerAvatar from "../components/CustomerAvatar";
import ServiceIcon from "../components/ServiceIcon";
import { serviceIconNames } from "../components/serviceIcons";
import { useAuth } from "../context/AuthContext";

const week = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const currency = (value = 0) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format((Number(value) || 0) / 100);
const rupees = (value = 0) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value) || 0);
const dateLabel = (value) => value ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value)) : "—";
const errorText = (error, fallback) => error.response?.data?.message || fallback;
const timeValue = (value) => {
  if (!value) return "";
  if (/^\d{2}:\d{2}$/.test(value)) return value;
  const match = String(value).match(/T(\d{2}:\d{2})/);
  return match?.[1] || "";
};
const timeLabel = (value) => value ? new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" }).format(new Date(`1970-01-01T${value}:00`)) : "—";

function PageHeading({ eyebrow, title, children, action }) {
  return <div className="page-heading">
    <div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{children && <p className="page-intro">{children}</p>}</div>
    {action}
  </div>;
}

function Alert({ message, type = "error", onClose }) {
  if (!message) return null;
  return <div className={`inline-alert ${type}`} role={type === "error" ? "alert" : "status"}>{type === "success" ? <CheckCircle2 size={17} /> : <CircleHelp size={17} />}<span>{message}</span>{onClose && <button aria-label="Dismiss" onClick={onClose}><X size={16} /></button>}</div>;
}

function StatCard({ label, value, icon: Icon, detail }) {
  return <div className="stat-card"><div className="stat-top"><span>{label}</span><span className="stat-icon"><Icon size={18} /></span></div><strong>{value}</strong><small>{detail}</small></div>;
}

export default function OwnerPages({ page }) {
  if (page === "bookings") return <BookingsPage />;
  if (page === "services") return <ServicesPage />;
  if (page === "availability") return <AvailabilityPage />;
  if (page === "payments") return <PaymentsPage />;
  if (page === "profile") return <ProfilePage />;
  return <DashboardPage />;
}

function DashboardPage() {
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Promise.all([client.get("/services"), client.get("/availability"), client.get("/bookings")])
      .then(([serviceResult, availabilityResult, bookingResult]) => {
        setServices(serviceResult.data.services || []);
        setAvailability(availabilityResult.data.availability || []);
        setBookings(bookingResult.data.bookings || []);
      })
      .catch((requestError) => setError(errorText(requestError, "We couldn’t load your workspace.")))
      .finally(() => setLoading(false));
  }, []);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/${user?.slug || ""}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Your browser blocked clipboard access. Copy the link from Business profile instead.");
    }
  };
  const liveServices = services.filter((service) => service.isActive);
  const upcomingBookings = bookings.filter((booking) => booking.status === "confirmed" && new Date(`${booking.date}T${booking.startTime}:00`) >= new Date());
  const availableDays = availability.filter((day) => (day.slot || []).length > 0).length;
  const setupComplete = liveServices.length > 0 && availableDays > 0;

  return <div className="page-content">
    <PageHeading eyebrow="YOUR BUSINESS AT A GLANCE" title={`Good ${new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, ${user?.name?.split(" ")[0] || "there"}.`} >
      A little overview of your booking desk.
    </PageHeading>
    <Alert message={error} onClose={() => setError("")} />
    <section className="welcome-banner">
      <div className="welcome-copy">
        <span className="welcome-kicker"><Sparkles size={14} /> YOUR BUSINESS, ON YOUR TIME</span>
        <h2>{user?.businessName || user?.buisnessName || "Your booking page is waiting."}</h2>
        <p>Get your services and availability ready, then share your page with the people you serve.</p>
        {user?.slug && <button className="button-light" onClick={copyLink}><Copy size={15} />{copied ? "Copied to clipboard" : "Copy your booking link"}</button>}
      </div>
      <div className="welcome-art" aria-hidden="true"><div className="art-circle"><CalendarClock size={36} /></div><div className="art-chip chip-one"><span className="chip-dot" /> New booking <strong>confirmed</strong></div><div className="art-chip chip-two"><span className="chip-avatar">A</span><span>Today, 10:30 am</span></div></div>
    </section>
    {loading ? <div className="loading-card"><LoaderCircle className="spin" /> Loading your workspace…</div> : <>
      <div className="stats-grid">
        <StatCard label="Services" value={services.length} icon={CalendarClock} detail={`${liveServices.length} visible to customers`} />
        <StatCard label="Open days" value={`${availableDays} / 7`} icon={Clock3} detail="Based on your weekly schedule" />
        <StatCard label="Upcoming bookings" value={upcomingBookings.length} icon={CalendarCheck2} detail={`${bookings.length} total appointments`} />
      </div>
      <div className="dashboard-lower">
        <section className="surface setup-surface">
          <div className="section-heading"><div><span className="eyebrow">A GOOD PLACE TO START</span><h2>Set up your booking page</h2></div><span className={`setup-status${setupComplete ? " done" : ""}`}>{setupComplete ? "Looking good" : "In progress"}</span></div>
          <div className="setup-steps">
            <Link to="/profile" className="setup-step"><span className={`step-check${user?.businessName ? " done" : ""}`}>{user?.businessName ? <Check size={15} /> : "1"}</span><span><strong>Tell us about your business</strong><small>Add your name, details, and brand.</small></span><ChevronRight size={17} /></Link>
            <Link to="/services" className="setup-step"><span className={`step-check${liveServices.length ? " done" : ""}`}>{liveServices.length ? <Check size={15} /> : "2"}</span><span><strong>Add the services you offer</strong><small>Give customers a clear way to book.</small></span><ChevronRight size={17} /></Link>
            <Link to="/availability" className="setup-step"><span className={`step-check${availableDays ? " done" : ""}`}>{availableDays ? <Check size={15} /> : "3"}</span><span><strong>Set your weekly availability</strong><small>Only show times that work for you.</small></span><ChevronRight size={17} /></Link>
          </div>
        </section>
        <section className="surface quick-links">
          <span className="eyebrow">YOUR DESK</span><h2>Keep things moving.</h2><p>Manage your services, share your page, and stay on top of payouts.</p>
          <Link to="/services" className="quick-link"><span className="quick-link-icon purple"><CalendarClock size={17} /></span><span><strong>Manage services</strong><small>{services.length} added</small></span><ArrowUpRight size={16} /></Link>
          <Link to="/payments" className="quick-link"><span className="quick-link-icon green"><Wallet size={17} /></span><span><strong>View payments</strong><small>Balance and payout settings</small></span><ArrowUpRight size={16} /></Link>
          <button className="quick-link quick-link-button" onClick={copyLink}><span className="quick-link-icon cream"><Copy size={17} /></span><span><strong>{copied ? "Link copied" : "Copy booking link"}</strong><small>Ready when you are</small></span><ArrowUpRight size={16} /></button>
          <Link to="/bookings" className="quick-link"><span className="quick-link-icon purple"><CalendarCheck2 size={17} /></span><span><strong>View bookings</strong><small>{upcomingBookings.length} coming up</small></span><ArrowUpRight size={16} /></Link>
        </section>
      </div>
      <section className="surface recent-bookings">
        <div className="section-heading"><div><span className="eyebrow">ON YOUR CALENDAR</span><h2>Upcoming bookings</h2></div><Link className="text-action" to="/bookings">See all <ArrowRight size={14} /></Link></div>
        {upcomingBookings.length === 0 ? <div className="table-empty"><CalendarDays size={18} /> Your confirmed appointments will show up here.</div> : <div className="dashboard-booking-list">{upcomingBookings.slice(0, 4).map((booking) => <div className="dashboard-booking-row" key={booking._id}><span className="booking-date-box"><small>{new Intl.DateTimeFormat("en-IN", { month: "short" }).format(new Date(`${booking.date}T00:00:00`))}</small><strong>{new Date(`${booking.date}T00:00:00`).getDate()}</strong></span><CustomerAvatar name={booking.customerName} identity={booking.customerEmail || booking.customerName} /><span className="dashboard-booking-copy"><strong>{booking.customerName}</strong><small>{booking.serviceId?.name || "Appointment"} · {dateLabel(booking.date)}</small></span><span className="booking-time">{timeLabel(booking.startTime)} – {timeLabel(booking.endTime)}</span></div>)}</div>}
      </section>
    </>}
  </div>;
}

function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [rescheduling, setRescheduling] = useState(null);

  const loadBookings = useCallback(async () => {
    try {
      const { data } = await client.get("/bookings", { params: filter === "all" ? {} : { status: filter } });
      setBookings(data.bookings || []);
    } catch (requestError) { setError(errorText(requestError, "We couldn’t load your bookings.")); }
    finally { setLoading(false); }
  }, [filter]);
  useEffect(() => { void Promise.resolve().then(loadBookings); }, [loadBookings]);

  const cancel = async (booking) => {
    const refundNote = booking.paymentStatus === "paid"
      ? "\n\nThis booking has already been paid. Cancellation will not automatically refund the customer; arrange the refund separately."
      : "";
    if (!window.confirm(`Cancel ${booking.customerName}’s ${booking.serviceId?.name || "appointment"}?${refundNote}`)) return;
    setError(""); setNotice("");
    try {
      await client.patch(`/bookings/${booking._id}/status`, { status: "cancelled" });
      setNotice("The booking was cancelled and the customer will be notified.");
      await loadBookings();
    } catch (requestError) { setError(errorText(requestError, "We couldn’t cancel this booking.")); }
  };
  const updateRescheduled = async (bookingId) => {
    setRescheduling(null);
    setNotice("Your booking was rescheduled and the customer will be notified.");
    await loadBookings();
    if (!bookingId) setError("The booking was updated but the list could not be refreshed.");
  };

  return <div className="page-content">
    <PageHeading eyebrow="YOUR APPOINTMENTS" title="Bookings, all together.">
      See who’s coming, keep appointments up to date, and make changes when plans shift.
    </PageHeading>
    <Alert message={error} onClose={() => setError("")} /><Alert message={notice} type="success" onClose={() => setNotice("")} />
    <section className="surface bookings-surface">
      <div className="section-heading"><div><span className="eyebrow">BOOKING LIST</span><h2>{bookings.length} {bookings.length === 1 ? "appointment" : "appointments"}</h2></div><label className="filter-select"><span className="sr-only">Filter bookings</span><select value={filter} onChange={(event) => { setFilter(event.target.value); setLoading(true); }}><option value="all">All bookings</option><option value="confirmed">Confirmed</option><option value="cancelled">Cancelled</option><option value="rescheduled">Rescheduled</option></select></label></div>
      {loading ? <div className="loading-card"><LoaderCircle className="spin" /> Loading bookings…</div> : bookings.length === 0 ? <div className="empty-state bookings-empty"><span className="empty-icon"><CalendarCheck2 size={24} /></span><h2>No bookings here yet.</h2><p>When a customer books one of your services, the appointment will show up here.</p><Link className="button-secondary" to="/services">Check your services <ArrowRight size={15} /></Link></div> :
        <div className="booking-list">{bookings.map((booking) => <article className="booking-row" key={booking._id}>
          <div className="booking-date-box"><small>{new Intl.DateTimeFormat("en-IN", { month: "short" }).format(new Date(`${booking.date}T00:00:00`))}</small><strong>{new Date(`${booking.date}T00:00:00`).getDate()}</strong><small>{new Intl.DateTimeFormat("en-IN", { weekday: "short" }).format(new Date(`${booking.date}T00:00:00`))}</small></div>
          <CustomerAvatar name={booking.customerName} identity={booking.customerEmail || booking.customerName} />
          <div className="booking-main"><div className="booking-customer"><strong>{booking.customerName}</strong><a href={`mailto:${booking.customerEmail}`}>{booking.customerEmail}</a></div><div className="booking-description"><span><CalendarClock size={14} /> {booking.serviceId?.name || "Appointment"}</span><span><Clock3 size={14} /> {timeLabel(booking.startTime)}–{timeLabel(booking.endTime)} · {booking.serviceId?.duration || "—"} min</span></div><div className="booking-status-line"><span className={`transaction-status ${booking.status}`}>{booking.status?.replaceAll("_", " ")}</span><span className={`transaction-status ${booking.paymentStatus}`}>{booking.amount > 0 ? `${booking.paymentStatus} · ${currency(booking.amount)}` : "Free booking"}</span>{booking.isRescheduled && <span className="rescheduled-label">Rescheduled {booking.rescheduleCount > 1 ? `${booking.rescheduleCount} times` : ""}</span>}</div></div>
          <div className="booking-actions">{booking.status === "confirmed" && <><button className="button-secondary" onClick={() => setRescheduling(booking)}>Reschedule</button><button className="button-quiet danger-action" onClick={() => cancel(booking)}>Cancel</button></>}</div>
        </article>)}</div>}
    </section>
    {rescheduling && <RescheduleDialog booking={rescheduling} onClose={() => setRescheduling(null)} onSuccess={updateRescheduled} onError={setError} />}
  </div>;
}

function RescheduleDialog({ booking, onClose, onSuccess, onError }) {
  const { user } = useAuth();
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!date || !booking.serviceId?._id || !user?.slug) return;
    const controller = new AbortController();
    void Promise.resolve().then(async () => {
      setLoadingSlots(true);
      setSelected(null);
      try {
        const { data } = await client.get(`/public/${encodeURIComponent(user.slug)}/slots`, {
          params: { date, serviceId: booking.serviceId._id },
          signal: controller.signal,
        });
        setSlots(data.slots || []);
      } catch (error) {
        if (!controller.signal.aborted) {
          setSlots([]);
          onError(errorText(error, "We couldn’t load times for that date."));
        }
      } finally {
        if (!controller.signal.aborted) setLoadingSlots(false);
      }
    });
    return () => controller.abort();
  }, [booking.serviceId?._id, date, onError, user?.slug]);

  const submit = async (event) => {
    event.preventDefault();
    if (!selected) return;
    setSaving(true);
    try {
      await client.patch(`/bookings/${booking._id}/reschedule`, { date, startTime: selected.startTime, endTime: selected.endTime });
      onSuccess(booking._id);
    } catch (error) {
      onError(errorText(error, "We couldn’t reschedule this booking."));
    } finally { setSaving(false); }
  };

  return <div className="modal-scrim" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="reschedule-modal" role="dialog" aria-modal="true" aria-labelledby="reschedule-title">
      <div className="section-heading"><div><span className="eyebrow">UPDATE APPOINTMENT</span><h2 id="reschedule-title">Find a new time</h2></div><button className="icon-button" onClick={onClose} aria-label="Close"><X size={18} /></button></div>
      <p className="modal-description">Choose a new date and time for {booking.customerName}’s {booking.serviceId?.name || "appointment"}.</p>
      <form className="settings-form" onSubmit={submit}>
        <label className="field-label">New date<input type="date" min={new Date().toISOString().slice(0, 10)} value={date} onChange={(event) => { setDate(event.target.value); setSlots([]); setSelected(null); }} required /></label>
        <span className="field-label">Available times</span>
        {loadingSlots ? <div className="slots-loading"><LoaderCircle className="spin" /> Finding a time…</div> : date && slots.length === 0 ? <div className="slots-empty">No available times on this date. Try another day.</div> : !date ? <div className="slots-empty">Choose a date to see available times.</div> : <div className="slot-grid">{slots.map((item) => <button key={item.startTime} type="button" className={`slot-button${selected?.startTime === item.startTime ? " selected" : ""}`} onClick={() => setSelected(item)}>{timeLabel(item.startTime)}</button>)}</div>}
        <div className="form-actions"><button className="button-primary" disabled={saving || !selected}>{saving ? "Updating…" : "Confirm new time"} <ArrowRight size={16} /></button><button type="button" className="button-quiet" onClick={onClose}>Keep current time</button></div>
      </form>
    </section>
  </div>;
}

function ServicesPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showForm, setShowForm] = useState(false);
  const emptyForm = { name: "", duration: "30", price: "0", description: "", icon: "C1.png" };
  const [form, setForm] = useState(emptyForm);

  const loadServices = useCallback(async () => {
    try {
      const { data } = await client.get("/services");
      setServices(data.services || []);
    } catch (requestError) {
      setError(errorText(requestError, "We couldn’t load your services."));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void Promise.resolve().then(loadServices); }, [loadServices]);

  const saveService = async (event) => {
    event.preventDefault();
    setSaving(true); setError(""); setNotice("");
    try {
      await client.post("/services", { ...form, duration: Number(form.duration), price: Number(form.price) });
      setForm(emptyForm); setShowForm(false); setNotice("Your new service has been added.");
      await loadServices();
    } catch (requestError) {
      setError(errorText(requestError, "We couldn’t save this service."));
    } finally { setSaving(false); }
  };

  const toggleService = async (service) => {
    setError(""); setNotice("");
    try {
      const { data } = await client.patch(`/services/${service._id}`, { isActive: !service.isActive });
      setServices((items) => items.map((item) => item._id === service._id ? data.service : item));
      setNotice(data.service.isActive ? "Service is now visible on your page." : "Service is hidden from your page.");
    } catch (requestError) { setError(errorText(requestError, "We couldn’t update this service.")); }
  };

  const deleteService = async (service) => {
    if (!window.confirm(`Remove “${service.name}” from your services?`)) return;
    setError("");
    try {
      await client.delete(`/services/${service._id}`);
      setServices((items) => items.filter((item) => item._id !== service._id));
      setNotice("Service removed.");
    } catch (requestError) { setError(errorText(requestError, "We couldn’t remove this service.")); }
  };

  return <div className="page-content">
    <PageHeading eyebrow="WHAT YOU OFFER" title="Your services" action={<button className="button-primary" onClick={() => setShowForm((value) => !value)}><Plus size={17} /> Add a service</button>}>
      Keep your offerings clear and easy to book.
    </PageHeading>
    <Alert message={error} onClose={() => setError("")} /><Alert message={notice} type="success" onClose={() => setNotice("")} />
    {showForm && <section className="surface form-surface">
      <div className="section-heading"><div><span className="eyebrow">NEW OFFERING</span><h2>Add a service</h2></div><button className="icon-button" onClick={() => setShowForm(false)} aria-label="Close"><X size={18} /></button></div>
      <form className="settings-form" onSubmit={saveService}>
        <label className="field-label">Service name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. 1:1 consultation" required /></label>
        <div className="form-row"><label className="field-label">Duration (minutes)<input type="number" min="5" step="5" value={form.duration} onChange={(event) => setForm({ ...form, duration: event.target.value })} required /></label><label className="field-label">Price (INR)<input type="number" min="0" step="1" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} required /><small>Set to 0 for a free booking.</small></label></div>
        <label className="field-label">A short description <span className="optional">Optional</span><textarea rows="3" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="What should customers know before booking?" /></label>
        <div className="field-label">Choose an icon<div className="icon-picker">{serviceIconNames.map((icon, index) => <button key={icon} type="button" className={`icon-choice${form.icon === icon ? " selected" : ""}`} onClick={() => setForm({ ...form, icon })} aria-label={`Choose service icon ${index + 1}`}><ServiceIcon name={icon} className="service-icon-image" /></button>)}</div></div>
        <div className="form-actions"><button className="button-primary" disabled={saving}>{saving ? "Saving…" : "Save service"} <ArrowRight size={16} /></button><button type="button" className="button-quiet" onClick={() => setShowForm(false)}>Cancel</button></div>
      </form>
    </section>}
    {loading ? <div className="loading-card"><LoaderCircle className="spin" /> Loading services…</div> : services.length === 0 ? <div className="surface empty-state"><span className="empty-icon"><CalendarClock size={24} /></span><h2>Your first service starts here.</h2><p>Add a service to tell customers what they can book and how long it takes.</p><button className="button-primary" onClick={() => setShowForm(true)}><Plus size={17} /> Add your first service</button></div> :
      <div className="service-grid">{services.map((service) => <article className="surface service-card" key={service._id}>
        <div className="service-card-top"><span className="service-icon"><ServiceIcon name={service.icon} className="service-icon-image" /></span><button className={`status-toggle${service.isActive ? " on" : ""}`} onClick={() => toggleService(service)} aria-label={`${service.isActive ? "Hide" : "Show"} ${service.name}`}><span /></button></div>
        <span className={`service-status${service.isActive ? " live" : ""}`}>{service.isActive ? "VISIBLE ON PAGE" : "HIDDEN FROM PAGE"}</span>
        <h2>{service.name}</h2><p>{service.description || "Add a short description to help customers know what to expect."}</p>
        <div className="service-meta"><span><Clock3 size={15} /> {service.duration} min</span><strong>{Number(service.price) > 0 ? rupees(service.price) : "Free"}</strong></div>
        <div className="service-card-actions"><span>Added {dateLabel(service.createdAt)}</span><button className="icon-button danger" onClick={() => deleteService(service)} aria-label={`Delete ${service.name}`}><Trash2 size={16} /></button></div>
      </article>)}</div>}
    <div className="info-note"><ShieldCheck size={17} /><span>Only services marked visible will appear on your public booking page.</span></div>
  </div>;
}

function AvailabilityPage() {
  const [days, setDays] = useState(week.map((name, dayOfWeek) => ({ dayOfWeek, name, slot: [] })));
  const [loading, setLoading] = useState(true);
  const [savingDay, setSavingDay] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    client.get("/availability").then(({ data }) => {
      const byDay = new Map((data.availability || []).map((day) => [day.dayOfWeek, day]));
      setDays(week.map((name, dayOfWeek) => ({
        dayOfWeek, name, slot: (byDay.get(dayOfWeek)?.slot || []).map((slot) => ({ startTime: timeValue(slot.startTime), endTime: timeValue(slot.endTime) })),
      })));
    }).catch((requestError) => setError(errorText(requestError, "We couldn’t load your weekly availability."))).finally(() => setLoading(false));
  }, []);

  const updateDay = (dayIndex, updater) => setDays((current) => current.map((day) => day.dayOfWeek === dayIndex ? updater(day) : day));
  const addSlot = (day) => updateDay(day.dayOfWeek, (current) => ({ ...current, slot: [...current.slot, { startTime: "09:00", endTime: "17:00" }] }));
  const updateSlot = (day, index, key, value) => updateDay(day.dayOfWeek, (current) => ({ ...current, slot: current.slot.map((slot, slotIndex) => slotIndex === index ? { ...slot, [key]: value } : slot) }));
  const removeSlot = (day, index) => updateDay(day.dayOfWeek, (current) => ({ ...current, slot: current.slot.filter((_, slotIndex) => slotIndex !== index) }));
  const saveDay = async (day) => {
    if (day.slot.some((slot) => !slot.startTime || !slot.endTime || slot.startTime >= slot.endTime)) {
      setError(`Check the start and end times for ${day.name}.`);
      return;
    }
    setSavingDay(day.dayOfWeek); setError(""); setNotice("");
    try {
      await client.put("/availability", { dayOfWeek: day.dayOfWeek, slot: day.slot });
      setNotice(`${day.name} availability saved.`);
    } catch (requestError) { setError(errorText(requestError, `We couldn’t save ${day.name}.`)); }
    finally { setSavingDay(null); }
  };

  return <div className="page-content">
    <PageHeading eyebrow="WHEN YOU'RE AVAILABLE" title="Make time for bookings.">
      Choose the hours that work for you. Customers only see slots that fit your services.
    </PageHeading>
    <Alert message={error} onClose={() => setError("")} /><Alert message={notice} type="success" onClose={() => setNotice("")} />
    <div className="surface availability-surface">
      <div className="availability-intro"><div className="availability-icon"><CalendarClock size={20} /></div><div><h2>Your weekly hours</h2><p>Set one or more time windows for each day.</p></div><span className="timezone-chip"><Clock3 size={13} /> {Intl.DateTimeFormat().resolvedOptions().timeZone || "Local time"}</span></div>
      {loading ? <div className="loading-card"><LoaderCircle className="spin" /> Loading your schedule…</div> : <div className="week-list">{days.map((day) => <section className="day-row" key={day.dayOfWeek}>
        <div className="day-name"><span>{day.name.slice(0, 3)}</span><small>{day.name}</small></div>
        <div className="day-slots">{day.slot.length === 0 ? <span className="day-off">Unavailable</span> : day.slot.map((slot, index) => <div className="time-range" key={`${day.dayOfWeek}-${index}`}>
          <input aria-label={`${day.name} start time`} type="time" value={slot.startTime} onChange={(event) => updateSlot(day, index, "startTime", event.target.value)} />
          <span>to</span>
          <input aria-label={`${day.name} end time`} type="time" value={slot.endTime} onChange={(event) => updateSlot(day, index, "endTime", event.target.value)} />
          <button className="icon-button" onClick={() => removeSlot(day, index)} aria-label={`Remove ${day.name} hours`}><X size={15} /></button>
        </div>)}
        <button className="add-hours" onClick={() => addSlot(day)}><Plus size={14} /> Add hours</button></div>
        <button className="day-save" onClick={() => saveDay(day)} disabled={savingDay === day.dayOfWeek}>{savingDay === day.dayOfWeek ? <LoaderCircle className="spin" size={15} /> : <Save size={15} />}<span>Save</span></button>
      </section>)}</div>}
    </div>
    <div className="info-note"><CircleHelp size={17} /><span>Times are shown in your local timezone. Add separate windows if you take a break during the day.</span></div>
  </div>;
}

function PaymentsPage() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [amount, setAmount] = useState("");
  const [showPayout, setShowPayout] = useState(false);
  const [payout, setPayout] = useState({ accountHolderName: "", bankName: "", accountNumber: "", ifsc: "", upiId: "" });

  const load = useCallback(async () => {
    try {
      const { data } = await client.get("/payment");
      setOverview(data);
      setPayout((current) => ({ ...current, accountHolderName: data.payoutDetails?.accountHolderName || "", bankName: data.payoutDetails?.bankName || "", ifsc: data.payoutDetails?.ifsc || data.payoutDetails?.ifscCode || "", upiId: data.payoutDetails?.upiId || "" }));
    } catch (requestError) { setError(errorText(requestError, "We couldn’t load your payment overview.")); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  const savePayout = async (event) => {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    try {
      const { data } = await client.patch("/payment/payout-details", payout);
      setOverview((previous) => ({ ...previous, payoutDetails: data.payoutDetails }));
      setPayout((previous) => ({ ...previous, accountNumber: "" }));
      setShowPayout(false); setNotice("Payout details saved securely.");
    } catch (requestError) { setError(errorText(requestError, "We couldn’t save your payout details.")); }
    finally { setSaving(false); }
  };
  const requestWithdrawal = async (event) => {
    event.preventDefault(); setWithdrawing(true); setError(""); setNotice("");
    try {
      await client.post("/payment/withdrawals", { amount: Math.round(Number(amount) * 100) });
      setAmount(""); setNotice("Withdrawal request submitted."); await load();
    } catch (requestError) { setError(errorText(requestError, "We couldn’t submit your withdrawal request.")); }
    finally { setWithdrawing(false); }
  };

  const wallet = overview?.wallet || {};
  const payoutDetails = overview?.payoutDetails || {};
  return <div className="page-content">
    <PageHeading eyebrow="YOUR EARNINGS" title="Payments, in one place.">
      Keep an eye on what you’ve earned and where your payouts are headed.
    </PageHeading>
    <Alert message={error} onClose={() => setError("")} /><Alert message={notice} type="success" onClose={() => setNotice("")} />
    {loading ? <div className="loading-card"><LoaderCircle className="spin" /> Loading your payments…</div> : <>
      <div className="money-banner"><div><span className="money-label"><Wallet size={15} /> AVAILABLE TO WITHDRAW</span><strong>{currency(wallet.available)}</strong><p>Funds from completed paid bookings.</p></div><div className="money-banner-note"><span className="money-note-icon"><ArrowDownLeft size={18} /></span><span><strong>{currency(wallet.earned)}</strong><small>Total earned so far</small></span></div></div>
      <div className="payment-columns">
        <section className="surface payout-surface"><div className="section-heading"><div><span className="eyebrow">PAYOUT DESTINATION</span><h2>Where should we send it?</h2></div><span className={`setup-status${payoutDetails.isComplete ? " done" : ""}`}>{payoutDetails.isComplete ? "Set up" : "Needs setup"}</span></div>
          {payoutDetails.isComplete && !showPayout ? <div className="payout-summary"><div className="payout-bank-icon"><Banknote size={20} /></div><div><strong>{payoutDetails.accountHolderName}</strong><small>{payoutDetails.upiId || `${payoutDetails.bankName || "Bank account"} ···· ${payoutDetails.accountLast4 || "••••"}`}</small></div><button className="button-quiet" onClick={() => setShowPayout(true)}>Edit</button></div> : !showPayout ? <div className="payout-empty"><p>Add payout details before requesting a withdrawal.</p><button className="button-primary" onClick={() => setShowPayout(true)}>Add payout details <ArrowRight size={16} /></button></div> :
            <form className="settings-form compact-form" onSubmit={savePayout}>
              <label className="field-label">Account holder name<input value={payout.accountHolderName} onChange={(event) => setPayout({ ...payout, accountHolderName: event.target.value })} required /></label>
              <div className="form-row"><label className="field-label">Bank name <span className="optional">Optional</span><input value={payout.bankName} onChange={(event) => setPayout({ ...payout, bankName: event.target.value })} /></label><label className="field-label">IFSC code <span className="optional">Optional</span><input value={payout.ifsc} onChange={(event) => setPayout({ ...payout, ifsc: event.target.value.toUpperCase() })} /></label></div>
              <label className="field-label">Bank account number <input inputMode="numeric" value={payout.accountNumber} onChange={(event) => setPayout({ ...payout, accountNumber: event.target.value })} placeholder={payoutDetails.accountLast4 ? `Update ending in ${payoutDetails.accountLast4}` : "Enter account number"} /></label>
              <div className="field-divider"><span>OR</span></div>
              <label className="field-label">UPI ID<input value={payout.upiId} onChange={(event) => setPayout({ ...payout, upiId: event.target.value })} placeholder="name@bank" /></label>
              <div className="form-actions"><button className="button-primary" disabled={saving}>{saving ? "Saving…" : "Save payout details"} <ArrowRight size={16} /></button><button type="button" className="button-quiet" onClick={() => setShowPayout(false)}>Cancel</button></div>
            </form>}
          <div className="privacy-note"><ShieldCheck size={16} /> Your full account number is never stored in the browser.</div>
        </section>
        <section className="surface withdraw-surface"><span className="eyebrow">MOVE YOUR EARNINGS</span><h2>Request a withdrawal</h2><p>Withdrawals are reviewed and processed by the platform.</p>
          <form className="withdraw-form" onSubmit={requestWithdrawal}><label className="field-label">Amount in rupees<span className="amount-input"><span>₹</span><input type="number" min="1" step="1" max={Math.floor((wallet.available || 0) / 100)} value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0" required /></span></label>
            <div className="available-line"><span>Available balance</span><button type="button" onClick={() => setAmount(String(Math.floor((wallet.available || 0) / 100)))}>{currency(wallet.available)} · Use all</button></div>
            <button className="button-primary button-full" disabled={withdrawing || !payoutDetails.isComplete || wallet.available < 100}>{withdrawing ? "Submitting…" : "Request withdrawal"} <ArrowRight size={16} /></button>
            {!payoutDetails.isComplete && <small className="form-hint">Add a payout destination first.</small>}
          </form>
        </section>
      </div>
      <section className="surface table-surface"><div className="section-heading"><div><span className="eyebrow">RECENT ACTIVITY</span><h2>Transactions</h2></div><span className="table-count">{(overview?.transactions || []).length} recent</span></div>
        {(overview?.transactions || []).length === 0 ? <div className="table-empty"><ArrowDownLeft size={18} /> Your bookings and payouts will show up here.</div> : <div className="table-scroll"><table><thead><tr><th>Activity</th><th>Date</th><th>Status</th><th className="align-right">Amount</th></tr></thead><tbody>{overview.transactions.map((item) => <tr key={item._id}><td><strong>{item.description || item.type?.replaceAll("_", " ")}</strong><small>{item.type?.replaceAll("_", " ")}</small></td><td>{dateLabel(item.createdAt)}</td><td><span className={`transaction-status ${item.status || "pending"}`}>{item.status || "pending"}</span></td><td className="align-right">{currency(item.amount)}</td></tr>)}</tbody></table></div>}
      </section>
      <section className="surface table-surface"><div className="section-heading"><div><span className="eyebrow">WITHDRAWAL HISTORY</span><h2>Your requests</h2></div></div>
        {(overview?.withdrawals || []).length === 0 ? <div className="table-empty">No withdrawal requests yet.</div> : <div className="table-scroll"><table><thead><tr><th>Requested</th><th>Status</th><th className="align-right">Amount</th></tr></thead><tbody>{overview.withdrawals.map((item) => <tr key={item._id}><td>{dateLabel(item.createdAt)}</td><td><span className={`transaction-status ${item.status}`}>{item.status}</span></td><td className="align-right">{currency(item.amount)}</td></tr>)}</tbody></table></div>}
      </section>
    </>}
  </div>;
}

function ProfilePage() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ businessName: user?.businessName || user?.buisnessName || "", businessDescription: user?.businessDescription || user?.buisnessDescription || "", timezone: user?.timezone || user?.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata", brandAccent: user?.brandAccent || "#047857" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const params = new URLSearchParams(window.location.search);
  const calendarResult = params.get("calendar");

  const save = async (event) => {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    try {
      const { data } = await client.post("/auth/profile", form);
      setUser(data.user); setNotice("Your business profile is up to date.");
    } catch (requestError) { setError(errorText(requestError, "We couldn’t save your profile.")); }
    finally { setSaving(false); }
  };
  const connectCalendar = async () => {
    setCalendarLoading(true); setError("");
    try {
      const { data } = await client.get("/integration/google/connect");
      window.location.assign(data.url);
    } catch (requestError) { setError(errorText(requestError, "We couldn’t connect Google Calendar.")); setCalendarLoading(false); }
  };
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(`${window.location.origin}/${user?.slug || ""}`); setCopied(true); window.setTimeout(() => setCopied(false), 1600); }
    catch { setError("Your browser blocked clipboard access."); }
  };

  return <div className="page-content">
    <PageHeading eyebrow="YOUR PLACE ON BOOKME" title="Make it feel like you.">
      This is what customers see before they book.
    </PageHeading>
    <Alert message={error} onClose={() => setError("")} /><Alert message={notice} type="success" onClose={() => setNotice("")} />
    {calendarResult && <Alert type={calendarResult === "connected" ? "success" : "error"} message={calendarResult === "connected" ? "Google Calendar is connected." : calendarResult === "missing_refresh_token" ? "Google did not grant calendar access. Please reconnect." : "Google Calendar could not be connected."} />}
    <div className="profile-grid">
      <section className="surface profile-form-surface"><div className="section-heading"><div><span className="eyebrow">BUSINESS DETAILS</span><h2>Your public profile</h2></div></div>
        <form className="settings-form" onSubmit={save}>
          <label className="field-label">Business name<input value={form.businessName} onChange={(event) => setForm({ ...form, businessName: event.target.value })} placeholder="How customers know you" required /></label>
          <label className="field-label">About your business<textarea rows="4" value={form.businessDescription} onChange={(event) => setForm({ ...form, businessDescription: event.target.value })} placeholder="A few words about what you do and who you help." /></label>
          <label className="field-label">Timezone<input value={form.timezone} onChange={(event) => setForm({ ...form, timezone: event.target.value })} placeholder="Asia/Kolkata" required /><small>Used to show booking times to customers.</small></label>
          <label className="field-label">Brand accent<div className="color-input-row"><input type="color" value={form.brandAccent} onChange={(event) => setForm({ ...form, brandAccent: event.target.value })} /><span>{form.brandAccent}</span></div></label>
          <button className="button-primary" disabled={saving}>{saving ? "Saving…" : "Save changes"} <Save size={16} /></button>
        </form>
      </section>
      <div className="profile-aside">
        <section className="surface booking-preview"><span className="eyebrow">YOUR BOOKING LINK</span><div className="booking-preview-card"><span className="preview-mark" style={{ backgroundColor: form.brandAccent }}><CalendarClock size={21} /></span><strong>{form.businessName || "Your business"}</strong><small>{form.businessDescription || "A clean place for your customers to book."}</small></div><div className="slug-line"><span>{window.location.host}/{user?.slug || "your-business"}</span><button className="icon-button" onClick={copyLink} aria-label="Copy booking link"><Copy size={15} /></button></div><button className="button-secondary button-full" onClick={copyLink}>{copied ? "Copied!" : "Copy booking link"} <ExternalLink size={15} /></button></section>
        <section className="surface calendar-connect"><div className="calendar-connect-icon"><CalendarClock size={19} /></div><div><span className="eyebrow">STAY IN SYNC</span><h2>Google Calendar</h2><p>{user?.googleCalendarConnected ? "Bookings can be added to your connected calendar." : "Connect your calendar to keep appointments together."}</p></div><button className={`button-secondary button-full${user?.googleCalendarConnected ? " connected" : ""}`} onClick={connectCalendar} disabled={calendarLoading || user?.googleCalendarConnected}>{user?.googleCalendarConnected ? <><BadgeCheck size={16} /> Connected</> : calendarLoading ? "Connecting…" : <>Connect Google Calendar <ArrowRight size={16} /></>}</button></section>
        <div className="profile-account"><span className="account-avatar">{user?.name?.slice(0, 1)?.toUpperCase() || "B"}</span><div><strong>{user?.name}</strong><small>{user?.email}</small></div><span className="account-lock"><ShieldCheck size={16} /></span></div>
      </div>
    </div>
  </div>;
}
