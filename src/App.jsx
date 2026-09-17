import { BrowserRouter as Router, Routes, Route, useLocation, Navigate, Outlet } from "react-router-dom";
import Sidebar from "./components/layout/Sidebar";
import Dashboard from "./pages/Dashboard/Dashboard";
import Clientes from "./pages/Clients/Clients";
import Solicitudes from "./pages/Requests/Requests";
import Quotes from "./pages/Quotes/Quotes";
import WorkOrders from "./pages/WorkOrders/WorkOrders";
import WorkOrderDetails from "./pages/WorkOrderDetails/WorkOrderDetails";
import Taller from "./pages/ShopFloor/ShopFloor";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword";
import ResetPassword from "./pages/ResetPassword/ResetPassword";

// Cambia a `true` cuando quieras bloquear el acceso sin login
const AUTH_PROTECTION_ENABLED = false;

// Guardián de rutas protegidas
function ProtectedRoute() {
  const location = useLocation();

  if (!AUTH_PROTECTION_ENABLED) {
    return <Outlet />;
  }

  const storedUser = localStorage.getItem("qualitytrack_user");

  if (!storedUser) {
    return <Navigate to={`/login?returnTo=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return <Outlet />;
}

function AppLayout() {
  const location = useLocation();
  const isAuthRoute =
    location.pathname === "/login" ||
    location.pathname === "/register" ||
    location.pathname === "/forgot-password" ||
    location.pathname === "/reset-password";
  const isShopFloor = location.pathname.startsWith("/taller");

  // Rutas que ocupan el 100% de la pantalla sin sidebar ni padding de escritorio
  const isFullScreen = isAuthRoute || isShopFloor;

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "var(--b44-bg-main, #080c16)",
      }}
    >
      {/* Oculta la barra lateral en Login/Auth y en Modo Taller */}
      {!isFullScreen && <Sidebar />}

      {/* Elimina padding en Login y Taller para centrar y ocupar todo el viewport */}
      <main
        style={{
          flex: 1,
          width: "100%",
          minHeight: "100vh",
          overflowX: "hidden",
          padding: isFullScreen ? 0 : "32px 40px",
          display: isAuthRoute ? "flex" : "block",
          alignItems: isAuthRoute ? "center" : "initial",
          justifyContent: isAuthRoute ? "center" : "initial",
        }}
      >
        <Routes>
          {/* Rutas Públicas de Autenticación */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Rutas Protegidas de la Aplicación */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/solicitudes" element={<Solicitudes />} />
            <Route path="/cotizaciones" element={<Quotes />} />
            <Route path="/ordenes" element={<WorkOrders />} />
            <Route path="/ordenes/:id" element={<WorkOrderDetails />} />
            <Route path="/taller" element={<Taller />} />
          </Route>
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}