import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
  Outlet,
} from "react-router-dom";
import Sidebar from "./components/layout/Sidebar";
import Dashboard from "./pages/Dashboard/Dashboard";
import Clientes from "./pages/Clients/Clients";
import Solicitudes from "./pages/Requests/Requests";
import Quotes from "./pages/Quotes/Quotes";
import WorkOrders from "./pages/WorkOrders/WorkOrders";
import WorkOrderDetails from "./pages/WorkOrderDetails/WorkOrderDetails";
import Taller from "./pages/ShopFloor/ShopFloor";
import Register from "./pages/Register/Register";
import Login from "./pages/Login/Login";
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword";
import ResetPassword from "./pages/ResetPassword/ResetPassword";
import Spinner from "./components/common/Spinner/Spinner";
import { AuthProvider, useAuth } from "./context/AuthContext";

const AUTH_PROTECTION_ENABLED = true;

// 1. Guardián de rutas protegidas
function ProtectedRoute() {
  const location = useLocation();
  const { user, loading } = useAuth();

  if (!AUTH_PROTECTION_ENABLED) {
    return <Outlet />;
  }

  if (loading) {
    return <Spinner fullScreen text="Verificando credenciales..." />;
  }

  if (!user) {
    // Si intenta entrar a "/", redirige directo a "/login" limpio.
    // Si intenta entrar a una ruta profunda (ej: "/ordenes"), conserva el returnTo.
    const redirectUrl =
      location.pathname === "/"
        ? "/login"
        : `/login?returnTo=${encodeURIComponent(location.pathname)}`;

    return <Navigate to={redirectUrl} replace />;
  }

  return <Outlet />;
}

// 2. Layout exclusivo de las páginas internas del sistema
function InternalLayout() {
  const location = useLocation();
  const isShopFloor = location.pathname.startsWith("/taller");

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "var(--bg-main)",
      }}
    >
      {!isShopFloor && <Sidebar />}

      <main
        style={{
          flex: 1,
          width: "100%",
          minHeight: "100vh",
          overflowX: "hidden",
          padding: isShopFloor ? 0 : "32px 40px",
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}

// 3. Layout exclusivo para pantallas de autenticación
function AuthLayoutWrapper() {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--bg-main)",
      }}
    >
      <Outlet />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Rutas Públicas de Autenticación */}
          <Route element={<AuthLayoutWrapper />}>
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>

          {/* Rutas Protegidas de la Aplicación */}
          <Route element={<ProtectedRoute />}>
            <Route element={<InternalLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/clientes" element={<Clientes />} />
              <Route path="/solicitudes" element={<Solicitudes />} />
              <Route path="/cotizaciones" element={<Quotes />} />
              <Route path="/ordenes" element={<WorkOrders />} />
              <Route path="/ordenes/:id" element={<WorkOrderDetails />} />
              <Route path="/taller" element={<Taller />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}