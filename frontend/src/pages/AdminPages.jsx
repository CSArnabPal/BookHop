import { ArrowLeft, ArrowRight, BadgeCheck, CircleAlert, Clock3, LoaderCircle, LogOut, RefreshCw, ShieldCheck, TrendingUp, Users, Wallet, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { getAdminDashboard, adminLogin, updateWithdrawalStatus } from "../api/admin";
import logo from "../assets/logo.png";
import CustomerAvatar from "../components/CustomerAvatar";

const money = (amount = 0) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format((Number(amount) || 0) / 100);
const day = (date) => date ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(date)) : "—";
const problem = (error) => error.response?.data?.message || "Something went wrong. Please try again.";

export default function AdminPages({ mode }) {
  if (mode === "login") return <AdminLogin />;
  return <AdminDashboard />;
}

function AdminLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  if (localStorage.getItem("adminToken")) return <Navigate to="/admin/dashboard" replace />;

  const submit = async (event) => {
    event.preventDefault(); setLoading(true); setError("");
    try {
      const { data } = await adminLogin(form);
      if (data.token) localStorage.setItem("adminToken", data.token);
      navigate("/admin/dashboard");
    } catch (requestError) { setError(problem(requestError)); }
    finally { setLoading(false); }
  };

  return <div className="admin-login-screen">
    <div className="admin-login-decoration"><span className="admin-orbit orbit-one" /><span className="admin-orbit orbit-two" /><div className="admin-brand"><img src={logo} alt="" /><span>BookHop</span><small>PLATFORM CONTROL</small></div><div className="admin-login-copy"><p className="eyebrow">SYSTEM ACCESS</p><h1>Behind every good booking is a little good housekeeping.</h1><p>Review payouts, keep an eye on platform health, and make sure every business gets the support it needs.</p></div><div className="admin-login-foot"><ShieldCheck size={16} /> Authorized administrators only</div></div>
    <main className="admin-login-main"><Link to="/login" className="back-link"><ArrowLeft size={16} /> Back to BookHop</Link><div className="admin-login-form"><span className="admin-form-icon"><ShieldCheck size={21} /></span><p className="eyebrow">ADMINISTRATOR</p><h2>Welcome back.</h2><p>Sign in to manage the BookHop platform.</p>{error && <div className="form-alert error" role="alert"><CircleAlert size={16} />{error}</div>}
      <form className="settings-form" onSubmit={submit}><label className="field-label">Admin email<input type="email" autoComplete="username" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="admin@example.com" required /></label><label className="field-label">Password<input type="password" autoComplete="current-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Your password" required /></label><button className="button-primary button-full" disabled={loading}>{loading ? "Signing in…" : "Secure login"} <ArrowRight size={17} /></button></form><div className="admin-secure-note"><ShieldCheck size={14} /> This area is restricted to platform administrators.</div></div><footer className="auth-legal"><span>© {new Date().getFullYear()} BookHop</span><span>Admin console</span></footer></main>
  </div>;
}

function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const { data: dashboard } = await getAdminDashboard();
      setData(dashboard);
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        localStorage.removeItem("adminToken");
        navigate("/admin/login");
      }
      setError(problem(requestError));
    } finally { setLoading(false); }
  }, [navigate]);
  useEffect(() => {
    if (!localStorage.getItem("adminToken")) {
      navigate("/admin/login", { replace: true });
      return;
    }
    void Promise.resolve().then(load);
  }, [load, navigate]);

  const updateStatus = async (withdrawal, status) => {
    setUpdating(withdrawal._id); setError(""); setNotice("");
    try {
      await updateWithdrawalStatus(withdrawal._id, { status });
      setNotice(`Withdrawal marked as ${status}.`);
      await load();
    } catch (requestError) { setError(problem(requestError)); }
    finally { setUpdating(""); }
  };

  const summary = data?.summary || {};
  return <div className="admin-dashboard">
    <header className="admin-topbar"><Link to="/admin/dashboard" className="brand-lockup"><img src={logo} alt="" /><span>BookHop <small>ADMIN</small></span></Link><div className="admin-top-actions"><span className="admin-session"><span /> Admin session</span><button className="button-quiet" onClick={() => { localStorage.removeItem("adminToken"); navigate("/admin/login"); }}><LogOut size={16} /> Sign out</button></div></header>
    <main className="admin-content">
      <div className="page-heading"><div><p className="eyebrow">PLATFORM OVERVIEW</p><h1>Good to have you back.</h1><p className="page-intro">A clear view of your platform, its businesses, and recent activity.</p></div><button className="button-secondary" onClick={load} disabled={loading}><RefreshCw size={15} className={loading ? "spin" : ""} /> Refresh</button></div>
      {error && <div className="inline-alert error" role="alert"><CircleAlert size={17} />{error}</div>}{notice && <div className="inline-alert success" role="status"><BadgeCheck size={17} />{notice}</div>}
      {loading && !data ? <div className="loading-card"><LoaderCircle className="spin" /> Loading platform data…</div> : <>
        <div className="admin-stats">
          <AdminStat icon={Users} label="Businesses" value={summary.users ?? 0} detail="Registered providers" />
          <AdminStat icon={CalendarCheckIcon} label="Bookings" value={summary.bookings ?? 0} detail={`${summary.paidBookings ?? 0} paid bookings`} />
          <AdminStat icon={TrendingUp} label="Gross revenue" value={money(summary.grossRevenue)} detail={`Platform fees ${money(summary.platformFees)}`} />
          <AdminStat icon={Wallet} label="Provider earnings" value={money(summary.walletEarned)} detail={`${money(summary.usersAvailableBalance)} available`} />
          <AdminStat icon={Clock3} label="Withdrawal requests" value={money(summary.pendingWithdrawals)} detail={`${money(summary.withdrawalHolds)} total held`} />
        </div>
        <section className="surface admin-section"><div className="section-heading"><div><span className="eyebrow">PAYOUT OPERATIONS</span><h2>Withdrawal requests</h2></div><span className="table-count">{(data?.withdrawals || []).length} recent</span></div><p className="admin-payout-note">Process the bank or UPI transfer separately, then update its status here.</p>
          {(data?.withdrawals || []).length === 0 ? <div className="table-empty">No payout requests yet.</div> : <div className="table-scroll"><table><thead><tr><th>Business</th><th>Requested</th><th>Destination</th><th>Status</th><th>Amount</th><th>Actions</th></tr></thead><tbody>{data.withdrawals.map((withdrawal) => {
            const terminal = ["paid", "rejected"].includes(withdrawal.status);
            return <tr key={withdrawal._id}><td><strong>{withdrawal.userId?.businessName || withdrawal.userId?.name || "Business"}</strong><small>{withdrawal.userId?.email || "—"}</small></td><td>{day(withdrawal.createdAt)}</td><td><strong>{withdrawal.payoutSnapshot?.accountHolderName || "—"}</strong><small>{withdrawal.payoutSnapshot?.upiId || `${withdrawal.payoutSnapshot?.bankName || "Bank"} ···· ${withdrawal.payoutSnapshot?.accountLast4 || ""}`}</small></td><td><span className={`transaction-status ${withdrawal.status}`}>{withdrawal.status}</span></td><td><strong>{money(withdrawal.amount)}</strong></td><td>{terminal ? <span className="terminal-label">{withdrawal.status === "paid" ? <BadgeCheck size={14} /> : <XCircle size={14} />} Finalized</span> : <div className="table-actions"><button className="button-quiet" disabled={updating === withdrawal._id} onClick={() => updateStatus(withdrawal, "processing")}>{updating === withdrawal._id ? <LoaderCircle className="spin" size={14} /> : "Process"}</button><button className="button-quiet success-action" disabled={updating === withdrawal._id} onClick={() => updateStatus(withdrawal, "paid")}>Mark paid</button><button className="button-quiet danger-action" disabled={updating === withdrawal._id} onClick={() => updateStatus(withdrawal, "rejected")}>Reject</button></div>}</td></tr>;
          })}</tbody></table></div>}
        </section>
        <div className="admin-lower-grid">
          <section className="surface admin-section"><div className="section-heading"><div><span className="eyebrow">THE COMMUNITY</span><h2>Recently joined</h2></div><span className="table-count">{(data?.users || []).length}</span></div>
            {(data?.users || []).length === 0 ? <div className="table-empty">New businesses will appear here.</div> : <div className="admin-user-list">{data.users.slice(0, 8).map((user) => <div className="admin-user-row" key={user._id}><span className="avatar">{(user.businessName || user.name || "B").slice(0, 1).toUpperCase()}</span><span><strong>{user.businessName || user.name}</strong><small>{user.email}</small></span><span className="user-joined">{day(user.createdAt)}</span></div>)}</div>}
          </section>
          <section className="surface admin-section"><div className="section-heading"><div><span className="eyebrow">RECENTLY PAID</span><h2>Latest bookings</h2></div></div>
            {(data?.recentBookings || []).length === 0 ? <div className="table-empty">Paid bookings will appear here.</div> : <div className="admin-booking-list">{data.recentBookings.map((booking) => <div className="admin-booking-row" key={booking._id}><CustomerAvatar name={booking.customerName} identity={booking.customerEmail || booking.customerName} /><span><strong>{booking.customerName}</strong><small>{booking.serviceId?.name || "Appointment"} · {booking.userId?.businessName || booking.userId?.name}</small></span><span><strong>{money(booking.amount)}</strong><small>{day(booking.updatedAt)}</small></span></div>)}</div>}
          </section>
        </div>
      </>}
    </main>
  </div>;
}

function AdminStat({ icon: Icon, label, value, detail }) {
  return <div className="admin-stat"><div><span>{label}</span><span className="admin-stat-icon"><Icon size={17} /></span></div><strong>{value}</strong><small>{detail}</small></div>;
}

function CalendarCheckIcon({ size = 16 }) {
  return <Clock3 size={size} />;
}
