import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import client from "./api/client";
import AppShell from "./components/AppShell";
import { AuthContext, useAuth } from "./context/AuthContext";
import AdminPages from "./pages/AdminPages";
import AuthPage from "./pages/AuthPage";
import OwnerPages from "./pages/OwnerPages";
import PublicBooking from "./pages/PublicBooking";
import { Link } from "react-router-dom";
import "./index.css";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="page-loading">Loading your workspace…</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}

function AuthenticatedApp() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem("token")));

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      return;
    }

    client
      .post("/auth/me")
      .then(({ data }) => setUser(data.user))
      .catch(() => {
        localStorage.removeItem("token");
      })
      .finally(() => setLoading(false));
  }, []);

  const auth = {
    user,
    setUser,
    loading,
    signOut: () => {
      localStorage.removeItem("token");
      setUser(null);
    },
  };

  return (
    <AuthContext.Provider value={auth}>
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" replace /> : <AuthPage mode="login" />}
        />
        <Route
          path="/register"
          element={user ? <Navigate to="/dashboard" replace /> : <AuthPage mode="register" />}
        />
        <Route path="/admin/login" element={<AdminPages mode="login" />} />
        <Route path="/admin/dashboard" element={<AdminPages mode="dashboard" />} />
        <Route path="/booking/success" element={<PublicBooking result="success" />} />
        <Route path="/booking/cancelled" element={<PublicBooking result="cancelled" />} />
        <Route path="/privacy" element={<LegalNotice kind="privacy" />} />
        <Route path="/terms" element={<LegalNotice kind="terms" />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppShell><OwnerPages page="dashboard" /></AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookings"
          element={
            <ProtectedRoute>
              <AppShell><OwnerPages page="bookings" /></AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/services"
          element={
            <ProtectedRoute>
              <AppShell><OwnerPages page="services" /></AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/availability"
          element={
            <ProtectedRoute>
              <AppShell><OwnerPages page="availability" /></AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/payments"
          element={
            <ProtectedRoute>
              <AppShell><OwnerPages page="payments" /></AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <AppShell><OwnerPages page="profile" /></AppShell>
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
        <Route path="/:slug" element={<PublicBooking />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthContext.Provider>
  );
}

function LegalNotice({ kind }) {
  const isPrivacy = kind === "privacy";
  return <main className="legal-page">
    <Link className="public-logo" to="/login"><img src="/favicon.svg" alt="" />BookHop</Link>
    <p className="eyebrow">BOOKME · {isPrivacy ? "PRIVACY" : "TERMS"}</p>
    <h1>{isPrivacy ? "Privacy information" : "Terms of service"}</h1>
    <p>This page is being prepared. Please contact the business directly if you have questions about a booking or your information.</p>
    <Link to="/login" className="button-secondary">Back to BookHop</Link>
  </main>;
}

export default function App() {
  return <AuthenticatedApp />;
}
