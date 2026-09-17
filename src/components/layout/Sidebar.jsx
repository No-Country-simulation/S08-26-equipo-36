import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FileText,
  FileCheck,
  ClipboardList,
  ChevronRight,
  Wrench,
  LogOut,
} from "lucide-react";
import styles from "./Sidebar.module.css";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/solicitudes", label: "Solicitudes", icon: FileText },
  { to: "/cotizaciones", label: "Cotizaciones", icon: FileCheck },
  { to: "/ordenes", label: "Órdenes de Trabajo", icon: ClipboardList },
  { to: "/taller", label: "Modo Taller", icon: Wrench },
];

export default function Sidebar({ onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isOTDetail = location.pathname.startsWith("/ordenes/");

  const handleLogout = () => {
    // Limpia la sesión del usuario en localStorage
    localStorage.removeItem("qualitytrack_user");

    // Ejecuta callback si existe, o redirige directamente a login
    if (onLogout) {
      onLogout();
    }
    navigate("/login");
  };

  return (
    <aside className={styles.sidebar}>
      {/* Header de la marca */}
      <img src="/Imagotipo-Sidebar.svg" alt="Logo" className={styles.logo} />

      {/* Navegación */}
      <nav className={styles.nav}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.navItemActive : ""}`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && <span className={styles.activeIndicator} />}
                  <Icon className={styles.navIcon} strokeWidth={2} />
                  <span>{item.label}</span>
                  {isOTDetail && item.to === "/ordenes" && (
                    <ChevronRight className={styles.navChevron} />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={styles.footer}>
        <p className={styles.footerText}>
          Trazabilidad centralizada de cada trabajo, desde la solicitud hasta la entrega.
        </p>
        <button
          type="button"
          onClick={handleLogout}
          className={styles.btnLogout}
        >
          <LogOut className={styles.navIcon} strokeWidth={2} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}