import {
  ArrowUpRight,
  CalendarDays,
  CalendarCheck2,
  CalendarRange,
  Copy,
  LayoutDashboard,
  LogOut,
  Settings2,
  WalletCards,
  X,
  Menu,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.png";

const navigation = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/bookings", label: "Bookings", icon: CalendarCheck2 },
  { to: "/services", label: "Services", icon: CalendarDays },
  { to: "/availability", label: "Availability", icon: CalendarRange },
  { to: "/payments", label: "Payments", icon: WalletCards },
  { to: "/profile", label: "Business profile", icon: Settings2 },
];

export default function AppShell({ children }) {
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const activeItem = navigation.find((item) => item.to === location.pathname);

  const copyBookingLink = async () => {
    const link = `${window.location.origin}/${user?.slug || ""}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      navigate("/profile");
    }
  };

  const sidebar = (
    <aside className="sidebar">
      <NavLink to="/dashboard" className="brand-lockup" onClick={() => setMobileOpen(false)}>
        <img src={logo} alt="" />
        <span>BookHop</span>
      </NavLink>
      <div className="workspace-label">WORKSPACE</div>
      <nav className="side-nav" aria-label="Workspace">
        {navigation.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
          >
            <Icon size={18} strokeWidth={1.8} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="help-card">
          <div className="help-icon"><Sparkles size={17} /></div>
          <strong>Your booking page</strong>
          <p>Share one simple link and let customers book in their own time.</p>
          <button className="text-action" onClick={copyBookingLink}>
            {copied ? "Link copied!" : "Copy booking link"} <ArrowUpRight size={14} />
          </button>
        </div>
        <button
          className="profile-mini"
          onClick={() => {
            signOut();
            navigate("/login");
          }}
        >
          <span className="avatar">{user?.name?.slice(0, 1)?.toUpperCase() || "B"}</span>
          <span className="profile-mini-copy">
            <strong>{user?.name || "Your account"}</strong>
            <small>Sign out</small>
          </span>
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );

  return (
    <div className="app-frame">
      {mobileOpen && <button className="mobile-scrim" aria-label="Close menu" onClick={() => setMobileOpen(false)} />}
      <div className={`sidebar-wrap${mobileOpen ? " open" : ""}`}>
        {sidebar}
        <button className="mobile-close" aria-label="Close menu" onClick={() => setMobileOpen(false)}><X /></button>
      </div>
      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button className="mobile-menu" aria-label="Open menu" onClick={() => setMobileOpen(true)}><Menu /></button>
            <div className="breadcrumb"><span>Workspace</span><span className="breadcrumb-slash">/</span><strong>{activeItem?.label || "Overview"}</strong></div>
          </div>
          <button className="topbar-share" onClick={copyBookingLink}>
            <Copy size={15} /> {copied ? "Copied!" : "Share booking page"}
          </button>
        </header>
        <div className="content-area">{children}</div>
      </main>
    </div>
  );
}
