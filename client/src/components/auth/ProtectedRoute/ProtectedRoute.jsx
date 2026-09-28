import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import Spinner from "../../common/Spinner/Spinner";

export default function ProtectedRoute({ children, enabled = false }) {
  const location = useLocation();
  const { user, loading } = useAuth();

  // Si está deshabilitado, deja pasar siempre
  if (!enabled) {
    return children;
  }

  // Mientras Supabase termina de leer el token OAuth desde la URL/storage
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          background: "#0f172a",
          color: "#f8fafc",
        }}
      >
        <Spinner size="lg" color="orange" />
        <p style={{ fontSize: "0.9rem", color: "#94a3b8" }}>
          Verificando credenciales...
        </p>
      </div>
    );
  }

  // Verifica sesión de Supabase o sesión manual previa en localStorage
  const storedUser = localStorage.getItem("qualitytrack_user");
  const isAuthenticated = Boolean(user || storedUser);

  if (!isAuthenticated) {
    return (
      <Navigate
        to={`/login?returnTo=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  return children;
}