import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({ children, enabled = false }) {
  const location = useLocation();

  // Si está deshabilitado (modo desarrollo), deja pasar siempre
  if (!enabled) {
    return children;
  }

  // Verifica si existe la sesión en localStorage
  const storedUser = localStorage.getItem("qualitytrack_user");

  if (!storedUser) {
    // Redirige a /login recordando a qué página intentaba ir
    return <Navigate to={`/login?returnTo=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return children;
}