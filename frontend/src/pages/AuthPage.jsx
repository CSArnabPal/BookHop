import { ArrowRight, CalendarCheck2, Check, Clock3, LockKeyhole, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.png";

const initialForm = {
  name: "",
  email: "",
  password: "",
  businessName: "",
  businessDescription: "",
  emailOtp: "",
};

export default function AuthPage({ mode }) {
  const isRegister = mode === "register";
  const [form, setForm] = useState(initialForm);
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const update = (key) => (event) => setForm((previous) => ({ ...previous, [key]: event.target.value }));

  const requestCode = async () => {
    setError("");
    setNotice("");
    setLoading(true);
    try {
      await client.post("/auth/register/request-otp", { email: form.email });
      setOtpSent(true);
      setNotice("A verification code has been sent to your email.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "We couldn’t send a verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);
    try {
      if (isRegister) {
        const { data } = await client.post("/auth/register", {
          ...form,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata",
        });
        setUser(data.user);
        navigate("/dashboard");
      } else {
        const { data } = await client.post("/auth/login", { email: form.email, password: form.password });
        setUser(data.user);
        navigate("/dashboard");
      }
    } catch (submitError) {
      setError(submitError.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-grid">
        <section className="auth-story">
          <Link to="/login" className="auth-brand">
            <span className="auth-brand-mark"><img src={logo} alt="" /></span>
            <span>BookHop</span>
          </Link>
          <div className="story-copy">
            <span className="eyebrow"><span className="eyebrow-dot" /> A little more room in your day</span>
            <h1>{isRegister ? <>Make time for<br /><em>what you do best.</em></> : <>A calmer way to<br /><em>fill your calendar.</em></>}</h1>
            <p>One thoughtful booking page for your services, availability, and the people you work with.</p>
          </div>
          <div className="story-feature-list">
            <div className="story-feature"><span><CalendarCheck2 size={18} /></span><div><strong>Set up in minutes</strong><small>Build a page that feels like your business</small></div><Check size={15} /></div>
            <div className="story-feature"><span><ShieldCheck size={18} /></span><div><strong>Bookings, beautifully handled</strong><small>Verified customers and secure checkout</small></div><Check size={15} /></div>
            <div className="story-feature"><span><Clock3 size={18} /></span><div><strong>Your time stays yours</strong><small>Customers book from your real availability</small></div><Check size={15} /></div>
          </div>
          <div className="story-footnote"><Sparkles size={15} /> A simple booking desk for independent businesses.</div>
        </section>

        <section className="auth-panel">
          <div className="auth-card">
            <div className="auth-mobile-brand"><img src={logo} alt="" /> BookHop</div>
            <div className="form-heading">
              <span className="form-icon">{isRegister ? <Sparkles size={19} /> : <LockKeyhole size={19} />}</span>
              <p className="eyebrow">{isRegister ? "GET STARTED" : "WELCOME BACK"}</p>
              <h2>{isRegister ? "Create your account" : "Good to see you again."}</h2>
              <p className="muted">{isRegister ? "A few details and your booking page is on its way." : "Log in to manage your bookings and business."}</p>
            </div>
            {error && <div className="form-alert error" role="alert">{error}</div>}
            {notice && <div className="form-alert success" role="status">{notice}</div>}
            <form className="auth-form" onSubmit={submit}>
              {isRegister && (
                <>
                  <label className="field-label">Your name
                    <input autoComplete="name" value={form.name} onChange={update("name")} placeholder="e.g. Alex Morgan" required />
                  </label>
                  <label className="field-label">Business name
                    <input autoComplete="organization" value={form.businessName} onChange={update("businessName")} placeholder="e.g. Studio Sunday" required />
                  </label>
                </>
              )}
              <label className="field-label">Email address
                <span className="input-wrap"><Mail size={17} /><input type="email" autoComplete="email" value={form.email} onChange={update("email")} placeholder="you@example.com" required /></span>
              </label>
              {isRegister && otpSent && <label className="field-label">Email verification code
                <input inputMode="numeric" autoComplete="one-time-code" value={form.emailOtp} onChange={update("emailOtp")} placeholder="Enter the code from your email" required />
              </label>}
              {isRegister && otpSent && <button className="otp-resend" type="button" onClick={requestCode} disabled={loading}>{loading ? "Sending…" : "Resend verification code"}</button>}
              <label className="field-label">Password
                <span className="input-wrap"><LockKeyhole size={17} /><input type="password" autoComplete={isRegister ? "new-password" : "current-password"} minLength={6} value={form.password} onChange={update("password")} placeholder={isRegister ? "At least 6 characters" : "Your password"} required /></span>
              </label>
              {isRegister && <p className="field-hint">We’ll use your local timezone to show appointment times correctly.</p>}
              {isRegister && !otpSent ? (
                <button className="button-primary button-full" type="button" onClick={requestCode} disabled={loading || !form.email}>
                  {loading ? "Sending code…" : "Verify email"} <ArrowRight size={17} />
                </button>
              ) : (
                <button className="button-primary button-full" type="submit" disabled={loading}>
                  {loading ? "Please wait…" : isRegister ? "Create account" : "Log in"} <ArrowRight size={17} />
                </button>
              )}
            </form>
            <p className="auth-switch">
              {isRegister ? "Already have an account?" : "New to BookHop?"}{" "}
              <Link to={isRegister ? "/login" : "/register"}>{isRegister ? "Log in" : "Create an account"}</Link>
            </p>
          </div>
          <footer className="auth-legal"><span>© {new Date().getFullYear()} BookHop</span><span><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link></span></footer>
        </section>
      </div>
    </div>
  );
}
