import { Link } from "react-router-dom";
import styles from "./WelcomeHeader.module.css";

const NAV_LINKS = [
  { href: "#como-trabajamos", label: "¿Cómo trabajamos?" },
  { href: "#modulos", label: "Capacidades Técnicas" },
  { href: "#seguimiento", label: "Seguimiento OT" },
  { href: "#contacto", label: "Contacto" },
];

export default function WelcomeHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link to="/" className={styles.brand}>
          <div className={styles.brandIconWrapper}>
            <img src="/Imagotipo-Sidebar.svg" alt="QualityTrack Logo" className={styles.logo} />
          </div>
        </Link>

        <nav className={styles.nav}>
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className={styles.navLink}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className={styles.actions}>
          <Link to="/login" className={styles.btnSecondary}>
            Portal Interno
          </Link>
          {/* <Link to="/register" className={styles.btnPrimary}>
            Crear Cuenta
          </Link> */}
        </div>
      </div>
    </header>
  );
}