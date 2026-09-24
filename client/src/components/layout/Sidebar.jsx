import { useState, useRef, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FileText,
  FileCheck,
  ClipboardList,
  ChevronRight,
  ChevronLeft,
  Wrench,
  LogOut,
  MessageCircleQuestion,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import styles from "./Sidebar.module.css";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/consultas", label: "Consultas", icon: MessageCircleQuestion },
  { to: "/solicitudes", label: "Solicitudes", icon: FileText },
  { to: "/cotizaciones", label: "Cotizaciones", icon: FileCheck },
  { to: "/ordenes", label: "Órdenes de Trabajo", icon: ClipboardList },
  { to: "/taller", label: "Modo Taller", icon: Wrench },
];

export default function Sidebar({ onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [prevPathname, setPrevPathname] = useState(location.pathname);
  const sidebarRef = useRef(null);
  const isOTDetail = location.pathname.startsWith("/ordenes/");

  // Cerrar sidebar inmediatamente si la ruta cambia sin disparar render en cascada
  if (prevPathname !== location.pathname) {
    setPrevPathname(location.pathname);
    setIsExpanded(false);
  }

  // Cerrar al hacer clic fuera del sidebar cuando está expandido en tablet
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        isExpanded &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target)
      ) {
        setIsExpanded(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isExpanded]);

  const handleLogout = async () => {
    try {
      await signOut();
      localStorage.removeItem("qualitytrack_user");
      if (onLogout) {
        onLogout();
      }
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <>
      {/* Backdrop para cerrar al tocar fuera en tablet */}
      {isExpanded && (
        <div
          className={styles.backdrop}
          onClick={() => setIsExpanded(false)}
          aria-hidden="true"
        />
      )}

      <aside
        ref={sidebarRef}
        className={`${styles.sidebar} ${isExpanded ? styles.sidebarExpanded : ""}`}
      >
        {/* Botón flotante circular en el borde derecho (estilo Pro Sidebar) */}
        <button
          type="button"
          className={styles.edgeToggleBtn}
          onClick={() => setIsExpanded(!isExpanded)}
          title={isExpanded ? "Colapsar menú" : "Expandir menú"}
          aria-label={isExpanded ? "Colapsar menú" : "Expandir menú"}
        >
          {isExpanded ? (
            <ChevronLeft size={10} strokeWidth={2.5} />
          ) : (
            <ChevronRight size={10} strokeWidth={2.5} />
          )}
        </button>

        {/* Header con Isotipo o Logo Completo */}
        <div className={styles.headerWrapper}>
          <img
            src="/Imagotipo-Sidebar.svg"
            alt="QualityTrack"
            className={styles.logoFull}
          />
          <img
            src="/Isotipo.svg"
            alt="QualityTrack"
            className={styles.logoIcon}
            onClick={() => setIsExpanded(!isExpanded)}
          />
        </div>

        {/* Navegación */}
        <nav className={styles.nav}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setIsExpanded(false)}
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.navItemActive : ""}`
                }
                title={item.label}
              >
                {({ isActive }) => (
                  <>
                    {isActive && <span className={styles.activeIndicator} />}
                    <Icon className={styles.navIcon} strokeWidth={2} />
                    <span className={styles.navLabel}>{item.label}</span>
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
            Trazabilidad centralizada de cada trabajo, desde la solicitud hasta
            la entrega.
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className={styles.btnLogout}
            title="Cerrar sesión"
          >
            <LogOut className={styles.navIcon} strokeWidth={2} />
            <span className={styles.navLabel}>Cerrar sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}
