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
import Inquiries from "./pages/Inquiries/Inquiries";
import Register from "./pages/Register/Register";
import Login from "./pages/Login/Login";
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword";
import ResetPassword from "./pages/ResetPassword/ResetPassword";
import Spinner from "./components/common/Spinner/Spinner";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Welcome from "./pages/Welcome/Welcome";
import OrderTracking from "./pages/OrderTracking/OrderTracking";

const AUTH_PROTECTION_ENABLED = true;

function ProtectedRoute() {
  const location = useLocation();
  const { user, loading } = useAuth();

  if (!AUTH_PROTECTION_ENABLED) return <Outlet />;
  if (loading) return <Spinner fullScreen text="Verificando credenciales..." />;

  if (!user) {
    const redirectUrl =
      location.pathname === "/"
        ? "/login"
        : `/login?returnTo=${encodeURIComponent(location.pathname)}`;
    return <Navigate to={redirectUrl} replace />;
  }

  return <Outlet />;
}

function InternalLayout() {
  const location = useLocation();
  const isShopFloor = location.pathname.startsWith("/taller");

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100%",
        overflow: "hidden",
        backgroundColor: "var(--bg-main)",
      }}
    >
      {!isShopFloor && <Sidebar />}
      <main
        style={{
          flex: 1,
          height: "100vh",
          overflowY: "auto",
          overflowX: "hidden",
          padding: 0,
          boxSizing: "border-box",
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}

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
          <Route path="/landing" element={<Welcome />} />
          <Route path="/seguimiento" element={<OrderTracking />} />

          <Route element={<AuthLayoutWrapper />}>
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<InternalLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/clientes" element={<Clientes />} />
              <Route path="/consultas" element={<Inquiries />} />
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